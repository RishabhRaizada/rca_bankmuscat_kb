import logging

from llm.client import call_llm
from llm.utils import safe_parse_json

logger = logging.getLogger(__name__)


def generate_taxonomy_suggestions(text: str, category: str, issue: str) -> dict:
    """Suggest category/sub_category/issue for messages that fall outside the taxonomy."""
    prompt = f"""
Return ONLY JSON.

You are a banking taxonomy expert.
A customer message was classified as "Outside Taxonomy".
Suggest what category, sub_category, and issue should cover it.

CUSTOMER MESSAGE: "{text}"

OUTPUT:
{{
  "suggested_category": "...",
  "suggested_sub_category": "...",
  "suggested_issue": "...",
  "reasoning": "..."
}}
"""
    try:
        result = safe_parse_json(call_llm(prompt))
        if result:
            return result
    except Exception as e:
        logger.error("Taxonomy suggestion error: %s", e)

    return {
        "suggested_category": None,
        "suggested_sub_category": None,
        "suggested_issue": None,
        "reasoning": "Suggestion generation failed",
    }
