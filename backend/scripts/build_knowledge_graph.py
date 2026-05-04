"""
Build knowledge_graph.json from taxonomy.py and the normalized JSON lookup table.

Run from the project root:
    python backend/scripts/build_knowledge_graph.py
"""

import json
import os
import sys

# Add backend/ to sys.path so sibling modules (taxonomy, etc.) are importable.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from taxonomy import RCA_TAXONOMY

_HERE = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.dirname(_HERE)
_PROJECT_ROOT = os.path.dirname(_BACKEND_DIR)

_JSON_PATH = os.path.join(_PROJECT_ROOT, "sample_data", "final_issue_rootcause_action_normalized.json")
_OUT_PATH = os.path.join(_BACKEND_DIR, "knowledge_base", "knowledge_graph.json")

nodes: dict = {}
edges: set = set()


def add_node(node_id: str, node_type: str, label: str) -> None:
    if node_id not in nodes:
        nodes[node_id] = {"id": node_id, "type": node_type, "label": label}


def add_edge(source: str, target: str, relation: str) -> None:
    edges.add((source, target, relation))


# Step 1 — build Category → SubCategory → Issue hierarchy from taxonomy
for entry in RCA_TAXONOMY:
    cat = entry["category"]
    sub = entry["sub_category"]
    issue = entry["issue"]

    cat_id = f"cat:{cat}"
    sub_id = f"sub:{sub}"
    issue_id = f"issue:{issue}"

    add_node(cat_id, "Category", cat)
    add_node(sub_id, "SubCategory", sub)
    add_node(issue_id, "Issue", issue)

    add_edge(cat_id, sub_id, "has_subcategory")
    add_edge(sub_id, issue_id, "has_issue")

# Step 2 — attach RootCauses and Actions from JSON lookup
with open(_JSON_PATH, encoding="utf-8") as f:
    lookup = json.load(f)

issue_labels = {" ".join(n["label"].split()): n["id"] for n in nodes.values() if n["type"] == "Issue"}
issue_labels_lower = {k.lower(): v for k, v in issue_labels.items()}

matched = 0
unmatched = []

for json_issue, data in lookup.items():
    if not isinstance(json_issue, str) or json_issue.strip().lower() == "nan":
        continue

    json_issue_clean = " ".join(json_issue.split())
    issue_id = issue_labels.get(json_issue_clean) or issue_labels_lower.get(json_issue_clean.lower())

    if issue_id is None:
        unmatched.append(json_issue)
        issue_id = f"issue:{json_issue}"
        add_node(issue_id, "Issue", json_issue)

    matched += 1

    for rc in data.get("root_causes", []):
        rc_id = f"rc:{rc}"
        add_node(rc_id, "RootCause", rc)
        add_edge(issue_id, rc_id, "caused_by")

    for action in data.get("actions", []):
        act_id = f"act:{action}"
        add_node(act_id, "Action", action)
        add_edge(issue_id, act_id, "resolved_by")

# Step 3 — serialize
graph = {
    "nodes": list(nodes.values()),
    "edges": [
        {"source": s, "target": t, "relation": r}
        for s, t, r in sorted(edges)
    ],
}

os.makedirs(os.path.dirname(_OUT_PATH), exist_ok=True)
with open(_OUT_PATH, "w", encoding="utf-8") as f:
    json.dump(graph, f, indent=2, ensure_ascii=False)

# Summary
node_types: dict[str, int] = {}
for n in nodes.values():
    node_types[n["type"]] = node_types.get(n["type"], 0) + 1

print(f"Graph written to: {_OUT_PATH}")
print(f"Nodes: {len(nodes):,}  |  Edges: {len(edges):,}")
for t, count in sorted(node_types.items()):
    print(f"  {t}: {count}")
print(f"JSON issues matched: {matched - len(unmatched)} / {matched}")
if unmatched:
    print(f"Unmatched ({len(unmatched)}):")
    for u in unmatched:
        print(f"  - {u}")
