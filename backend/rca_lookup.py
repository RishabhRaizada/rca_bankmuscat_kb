import json
import os
from rapidfuzz import process, fuzz
import logging

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOOKUP_PATH = os.path.join(BASE_DIR, "..", "sample_data", "final_issue_rootcause_action_normalized.json")

with open(LOOKUP_PATH, encoding="utf-8") as f:
    RCA_DATA = json.load(f)

ISSUE_KEYS = list(RCA_DATA.keys())
logger.info(f"RCA lookup loaded: {len(ISSUE_KEYS)} issue entries")


def lookup_rca(issue: str, sub_category: str = "", category: str = "") -> dict:
    """
    Fast fuzzy match of the classified issue against ~200 known issue keys.
    Returns root_causes and actions lists from the normalized lookup table.
    No LLM calls — purely deterministic keyword/fuzzy matching.
    """
    _skip = {"outside taxonomy", "others", "unmapped", "not a complaint", "statement", ""}
    if not issue or issue.lower().strip() in _skip:
        return {"root_causes": [], "actions": [], "matched_issue": None, "match_score": 0}

    # Primary: combine issue + sub_category for richer context
    query = f"{issue} {sub_category}".strip() if sub_category else issue
    result = process.extractOne(query, ISSUE_KEYS, scorer=fuzz.token_sort_ratio)

    if not result or result[1] < 38:
        # Fallback: issue name alone with partial_ratio
        result = process.extractOne(issue, ISSUE_KEYS, scorer=fuzz.partial_ratio)
        if not result or result[1] < 42:
            logger.debug(f"No RCA match for issue='{issue}' sub='{sub_category}'")
            return {"root_causes": [], "actions": [], "matched_issue": None, "match_score": 0}

    matched_key, score, _ = result
    data = RCA_DATA[matched_key]
    logger.debug(f"RCA match: '{issue}' -> '{matched_key}' (score={score})")

    return {
        "root_causes": data.get("root_causes", []),
        "actions": data.get("actions", []),
        "matched_issue": matched_key,
        "match_score": score,
    }
