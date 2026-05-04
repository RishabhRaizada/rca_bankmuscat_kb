"""
LLM enrichment pass over knowledge_graph.json.

Two enrichment steps:
  1. Deduplicate Action nodes — semantically equivalent labels are collapsed to
     one canonical label; edges are redirected accordingly.
  2. Weight caused_by edges — each Issue→RootCause edge gains a `weight` (0.0–1.0)
     reflecting the relative likelihood of that root cause for that issue.
     Weights per issue sum to 1.0.

Run from the project root:
    python backend/scripts/enrich_knowledge_graph.py

Rebuild with build_knowledge_graph.py before re-running this script.
"""

import json
import logging
import os
import sys
import time

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

_HERE = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.dirname(_HERE)
_PROJECT_ROOT = os.path.dirname(_BACKEND_DIR)

_KG_PATH = os.path.join(_BACKEND_DIR, "knowledge_base", "knowledge_graph.json")

# Reuse LLM credentials from environment / key.json
from anthropic import AnthropicVertex
from dotenv import load_dotenv
from google.oauth2 import service_account

load_dotenv()

_raw_key = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "./key.json")
_KEY_FILE = _raw_key if os.path.isabs(_raw_key) else os.path.join(_PROJECT_ROOT, _raw_key.lstrip("./\\"))
_LOCATION = os.getenv("VERTEX_LOCATION", "us-east5")
_MODEL = os.getenv("VERTEX_MODEL", "claude-sonnet-4-5")


def _llm(prompt: str, max_tokens: int = 4096, retries: int = 3) -> str:
    """Call Vertex Claude with a higher token ceiling than the pipeline default."""
    creds = service_account.Credentials.from_service_account_file(
        _KEY_FILE, scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    with open(_KEY_FILE) as f:
        project_id = json.load(f)["project_id"]

    client = AnthropicVertex(project_id=project_id, region=_LOCATION, credentials=creds)

    for attempt in range(retries):
        try:
            resp = client.messages.create(
                model=_MODEL,
                max_tokens=max_tokens,
                temperature=0.1,
                messages=[{
                    "role": "user",
                    "content": f"Return ONLY valid JSON. No markdown, no explanation.\n\n{prompt}",
                }],
            )
            return "".join(b.text for b in resp.content if hasattr(b, "text")).strip()
        except Exception as e:
            if attempt == retries - 1:
                raise
            wait = 2 ** attempt
            log.warning("LLM attempt %d/%d failed (%s) — retrying in %ds", attempt + 1, retries, e, wait)
            time.sleep(wait)
    return ""


def _parse(raw: str) -> object:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```", 2)[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip().rstrip("`").strip())


def load_graph() -> tuple[dict, list]:
    with open(_KG_PATH, encoding="utf-8") as f:
        raw = json.load(f)
    nodes = {n["id"]: n for n in raw["nodes"]}
    edges = raw["edges"]
    return nodes, edges


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1 — DEDUPLICATE ACTION NODES
# ═══════════════════════════════════════════════════════════════════════════════

_DEDUP_BATCH = 80


def _dedup_batch(action_labels: list[str]) -> dict[str, str]:
    numbered = "\n".join(f"{i+1}. {a}" for i, a in enumerate(action_labels))
    prompt = f"""
You are normalising action labels from a bank complaint system.

Below is a list of action labels. Many are duplicates or near-duplicates caused by
typos, phrasing differences, or capitalisation differences.

Group them and choose ONE canonical label per group (prefer the clearest, most concise
English phrasing). Return a JSON object mapping EVERY input label exactly as given
to its canonical label. Labels that have no duplicate should map to themselves.

INPUT LABELS:
{numbered}

OUTPUT FORMAT (map every input label to its canonical):
{{
  "original label 1": "canonical label",
  "original label 2": "canonical label",
  ...
}}
"""
    raw = _llm(prompt, max_tokens=4096)
    result = _parse(raw)
    if not isinstance(result, dict):
        raise ValueError(f"Expected dict, got {type(result)}")
    return result


def deduplicate_actions(nodes: dict, edges: list) -> tuple[dict, list, dict]:
    action_labels = [n["label"] for n in nodes.values() if n["type"] == "Action"]
    log.info("Step 1: Deduplicating %d action labels...", len(action_labels))

    canonical_map: dict[str, str] = {}
    for start in range(0, len(action_labels), _DEDUP_BATCH):
        batch = action_labels[start:start + _DEDUP_BATCH]
        log.info("  Dedup batch %d–%d...", start + 1, start + len(batch))
        try:
            mapping = _dedup_batch(batch)
            for label in batch:
                canonical = mapping.get(label, label)
                canonical_map[label] = canonical if isinstance(canonical, str) and canonical.strip() else label
        except Exception as e:
            log.warning("  Batch failed (%s) — keeping originals for this batch", e)
            for label in batch:
                canonical_map[label] = label

    id_remap: dict[str, str] = {}
    for n in list(nodes.values()):
        if n["type"] == "Action":
            canonical_label = canonical_map.get(n["label"], n["label"])
            id_remap[n["id"]] = f"act:{canonical_label}"

    new_nodes = {nid: n for nid, n in nodes.items() if n["type"] != "Action"}
    for original_id, canonical_id in id_remap.items():
        if canonical_id not in new_nodes:
            canonical_label = canonical_id[len("act:"):]
            new_nodes[canonical_id] = {"id": canonical_id, "type": "Action", "label": canonical_label}

    new_edges = []
    seen_edges: set[tuple] = set()
    for e in edges:
        target = id_remap.get(e["target"], e["target"])
        key = (e["source"], target, e["relation"])
        if key not in seen_edges:
            seen_edges.add(key)
            new_edges.append({"source": e["source"], "target": target, "relation": e["relation"]})

    collapsed = len(action_labels) - len(set(canonical_map.values()))
    log.info("  Actions: %d → %d (collapsed %d duplicates)", len(action_labels),
             len(set(canonical_map.values())), collapsed)

    return new_nodes, new_edges, canonical_map


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2 — WEIGHT caused_by EDGES
# ═══════════════════════════════════════════════════════════════════════════════

_WEIGHT_BATCH = 20


def _weight_batch(issue_causes: dict[str, list[str]]) -> dict[str, dict[str, float]]:
    def _fmt_causes(causes):
        return ", ".join(f'"{c}"' for c in causes)

    items = "\n".join(
        f'  "{issue}": [{_fmt_causes(causes)}]'
        for issue, causes in issue_causes.items()
    )
    prompt = f"""
You are a banking operations analyst. For each bank complaint issue listed below,
assign a relative likelihood weight (0.0–1.0) to each of its possible root causes.
Weights for each issue MUST sum to exactly 1.0.

Base your weights on operational knowledge of bank complaints:
- Which root causes are most common for that type of issue?
- If only one root cause exists, assign it weight 1.0.
- If causes are truly unknown, distribute evenly.

ISSUES AND THEIR POSSIBLE ROOT CAUSES:
{{
{items}
}}

OUTPUT FORMAT:
{{
  "Issue Name": {{"Root Cause A": 0.6, "Root Cause B": 0.4}},
  ...
}}
"""
    raw = _llm(prompt, max_tokens=2048)
    result = _parse(raw)
    if not isinstance(result, dict):
        raise ValueError(f"Expected dict, got {type(result)}")
    return result


def add_weights(nodes: dict, edges: list) -> list:
    issue_causes: dict[str, list[str]] = {}
    for e in edges:
        if e["relation"] == "caused_by":
            issue_label = nodes.get(e["source"], {}).get("label", "")
            rc_label = nodes.get(e["target"], {}).get("label", "")
            if issue_label and rc_label:
                issue_causes.setdefault(issue_label, []).append(rc_label)

    issues = list(issue_causes.keys())
    log.info("Step 2: Weighting caused_by edges for %d issues (%d batches of %d)...",
             len(issues), -(-len(issues) // _WEIGHT_BATCH), _WEIGHT_BATCH)

    all_weights: dict[str, dict[str, float]] = {}
    for start in range(0, len(issues), _WEIGHT_BATCH):
        batch_issues = issues[start:start + _WEIGHT_BATCH]
        batch = {iss: issue_causes[iss] for iss in batch_issues}
        log.info("  Weight batch %d–%d...", start + 1, start + len(batch_issues))
        try:
            result = _weight_batch(batch)
            all_weights.update(result)
        except Exception as e:
            log.warning("  Batch failed (%s) — using even weights", e)
            for iss, causes in batch.items():
                w = round(1.0 / len(causes), 4) if causes else 1.0
                all_weights[iss] = {c: w for c in causes}

    weighted_edges = []
    for e in edges:
        if e["relation"] == "caused_by":
            issue_label = nodes.get(e["source"], {}).get("label", "")
            rc_label = nodes.get(e["target"], {}).get("label", "")
            weights_for_issue = all_weights.get(issue_label, {})
            weight = weights_for_issue.get(rc_label)
            if weight is None:
                n = len(issue_causes.get(issue_label, [])) or 1
                weight = round(1.0 / n, 4)
            edge = dict(e)
            edge["weight"] = round(float(weight), 4)
            weighted_edges.append(edge)
        else:
            weighted_edges.append(e)

    return weighted_edges


def main() -> None:
    log.info("Loading graph from %s", _KG_PATH)
    nodes, edges = load_graph()
    log.info("Loaded: %d nodes, %d edges", len(nodes), len(edges))

    nodes, edges, _ = deduplicate_actions(nodes, edges)
    log.info("After dedup: %d nodes, %d edges", len(nodes), len(edges))

    edges = add_weights(nodes, edges)

    graph = {
        "nodes": list(nodes.values()),
        "edges": sorted(edges, key=lambda e: (e["source"], e["relation"], e["target"])),
    }
    with open(_KG_PATH, "w", encoding="utf-8") as f:
        json.dump(graph, f, indent=2, ensure_ascii=False)

    node_types: dict[str, int] = {}
    for n in nodes.values():
        node_types[n["type"]] = node_types.get(n["type"], 0) + 1

    weighted = sum(1 for e in edges if "weight" in e)
    log.info("Enriched graph saved to %s", _KG_PATH)
    log.info("Nodes: %d total — %s", len(nodes),
             ", ".join(f"{t}: {c}" for t, c in sorted(node_types.items())))
    log.info("Edges: %d total, %d with weights", len(edges), weighted)


if __name__ == "__main__":
    main()
