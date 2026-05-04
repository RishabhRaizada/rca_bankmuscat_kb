import logging

from llm.client import call_llm
from llm.utils import safe_parse_json

logger = logging.getLogger(__name__)


def generate_rca_summary(
    original_text: str,
    message_type: str,
    category: str,
    sub_category: str,
    issue: str,
    cause: str,
    next_steps: list,
    kb_context: str = "",
    graph_context: str = "",
) -> str:
    steps_text = "; ".join(next_steps[:4]) if next_steps else "Manual review required"

    kb_section = (
        f"\n\nKNOWLEDGE BASE — use this context to write a precise, Bank Muscat-specific summary:\n"
        f"{kb_context[:6000]}\n"
    ) if kb_context else ""

    graph_section = (
        f"\n\nKNOWLEDGE GRAPH — validated root causes and actions for this exact issue:\n"
        f"{graph_context}\n"
    ) if graph_context else ""

    prompt = f"""
Return ONLY JSON.

You are a banking operations analyst writing a brief internal RCA note for Bank Muscat.
{kb_section}{graph_section}
Context:
- Message Type: {message_type}
- Category: {category} > {sub_category}
- Issue: {issue}
- Root Cause: {cause or "To be determined"}
- Recommended Actions: {steps_text}
- Original Message: "{original_text[:400]}"

Write a concise 2-3 sentence business summary that:
1. Describes specifically what the customer experienced or asked about (use Bank Muscat product/system names where relevant)
2. Identifies the precise root cause using operational context from the knowledge base (use exact action names and system references where applicable)

OUTPUT:
{{
  "rca_summary": "Your 2-3 sentence paragraph here."
}}
"""
    try:
        result = safe_parse_json(call_llm(prompt))
        if result:
            summary = (result.get("rca_summary") or "").strip()
            if len(summary) > 20:
                return summary
    except Exception as e:
        logger.warning("RCA summary generation failed: %s", e)

    cause_text = cause or "undetermined cause"
    return (
        f"Customer reported '{issue}' under {category} ({sub_category}). "
        f"Root cause identified as {cause_text}. "
        f"Recommended next steps: {steps_text}."
    )


def generate_fallback_cause_and_steps(
    text: str,
    category: str,
    sub_category: str,
    issue: str,
    is_complaint: bool,
) -> dict:
    if not is_complaint:
        return {
            "root_cause": f"Customer inquiry about {issue or category}",
            "next_steps": ["Contact customer and provide relevant information"],
        }

    prompt = f"""
Return ONLY JSON.

Banking complaint: "{text}"
Category: {category} | SubCategory: {sub_category} | Issue: {issue}

Generate a realistic root cause and resolution steps.

{{
  "root_cause": "Specific root cause",
  "next_steps": ["Step 1", "Step 2"]
}}
"""
    try:
        result = safe_parse_json(call_llm(prompt))
        if result:
            root_cause = (result.get("root_cause") or "").strip()
            steps = result.get("next_steps", [])
            if root_cause and root_cause.lower() not in ("unknown", "none", "n/a"):
                return {
                    "root_cause": root_cause,
                    "next_steps": steps if isinstance(steps, list) else [steps],
                }
    except Exception as e:
        logger.warning("Fallback cause/steps failed: %s", e)

    return {
        "root_cause": f"Service issue in {category}: {issue}",
        "next_steps": [f"Investigate and resolve the {category.lower()} issue"],
    }
