import json
import logging
import os

logger = logging.getLogger(__name__)

_KG_PATH = os.path.join(
    os.path.dirname(__file__), "..", "knowledge_base", "knowledge_graph.json"
)

_kg_cache: dict | None = None


def _load_graph() -> dict:
    global _kg_cache
    if _kg_cache is None:
        try:
            with open(_KG_PATH, encoding="utf-8") as f:
                raw = json.load(f)
            edges_by_source: dict[str, list[dict]] = {}
            for edge in raw.get("edges", []):
                edges_by_source.setdefault(edge["source"], []).append(edge)
            _kg_cache = {
                "nodes": {n["id"]: n for n in raw.get("nodes", [])},
                "edges": edges_by_source,
            }
        except Exception as e:
            logger.warning("Could not load knowledge graph: %s", e)
            _kg_cache = {"nodes": {}, "edges": {}}
    return _kg_cache


def graph_context_for_issue(issue: str) -> str:
    """
    Return a compact structured fact block for the given issue label.
    Returns empty string if the issue is not in the graph.
    """
    graph = _load_graph()
    issue_id = f"issue:{issue}"

    if issue_id not in graph["nodes"]:
        normalised = " ".join(issue.split())
        issue_id = f"issue:{normalised}"
        if issue_id not in graph["nodes"]:
            return ""

    edges = graph["edges"].get(issue_id, [])
    root_causes = [e["target"].replace("rc:", "") for e in edges if e["relation"] == "caused_by"]
    actions = [e["target"].replace("act:", "") for e in edges if e["relation"] == "resolved_by"]

    if not root_causes and not actions:
        return ""

    lines = [f"Graph context for '{issue}':"]
    if root_causes:
        lines.append(f"  - Root causes: {', '.join(root_causes)}")
    if actions:
        lines.append(f"  - Recommended actions: {', '.join(actions)}")
    return "\n".join(lines)
