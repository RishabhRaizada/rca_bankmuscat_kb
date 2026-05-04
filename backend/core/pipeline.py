import logging

from core.classifier import STEP1_STATIC_PROMPT, log_cache_usage, normalize_classification
from core.rca import generate_fallback_cause_and_steps, generate_rca_summary
from core.taxonomy_suggestions import generate_taxonomy_suggestions
from knowledge.graph_loader import graph_context_for_issue
from knowledge.kb_loader import load_kb_context
from llm.client import call_llm_cached
from llm.utils import safe_parse_json
from rca_lookup import lookup_rca

logger = logging.getLogger(__name__)

_OUTPUT_FIELDS = [
    "original_text",
    "translated_text",
    "message_type",
    "sentiment",
    "is_mapped",
    "category",
    "sub_category",
    "issue",
    "possible_causes",
    "root_cause",
    "rca_summary",
    "next_steps",
    "confidence_score",
]

_UNCLASSIFIED_BASE = {
    "translated_text": "",
    "message_type": "Unclassified",
    "sentiment": "Neutral",
    "is_mapped": False,
    "category": "Unclassified",
    "sub_category": "Unclassified",
    "issue": "LLM unavailable",
    "possible_causes": [],
    "root_cause": "",
    "rca_summary": "LLM unavailable. Please retry.",
    "next_steps": [],
    "confidence_score": 0.0,
}


def _build_output(d: dict) -> dict:
    return {k: d.get(k, "") for k in _OUTPUT_FIELDS}


def process_complaint(text: str) -> dict:
    """
    Step 1 — LLM classifies + maps to taxonomy  (prompt-cached)
    Step 2 — Fast deterministic RCA lookup (no LLM)
    Step 3 — LLM writes rca_summary paragraph
    Statements skip Steps 2 & 3 entirely.
    """

    # Step 1 — Classification + taxonomy mapping
    try:
        response_1, cache_usage = call_llm_cached(
            static_prompt=STEP1_STATIC_PROMPT,
            dynamic_text=f"TEXT:\n{text}",
        )
        log_cache_usage(cache_usage)
    except Exception as e:
        logger.error("Step 1 LLM call failed: %s", e)
        return _build_output({"original_text": text, **_UNCLASSIFIED_BASE})

    logger.info("Step 1 raw response: %s", response_1)

    parsed = safe_parse_json(response_1)
    if not parsed:
        if not response_1:
            logger.error("LLM returned empty string — check Vertex AI credentials. text=%.120s", text)
        else:
            logger.error("Step 1 response not parseable as JSON: %s", response_1[:300])
        return _build_output({"original_text": text, **_UNCLASSIFIED_BASE})

    parsed = normalize_classification(parsed)

    category = parsed.get("category", "")
    sub_category = parsed.get("sub_category", "")
    issue = parsed.get("issue", "")
    is_complaint = parsed.get("is_complaint", False)
    msg_type = parsed.get("message_type", "Statement")

    # Short-circuit: Statements need no lookup or RCA summary
    if msg_type == "Statement":
        return _build_output({
            "original_text": text,
            "translated_text": parsed.get("translated_text", ""),
            "message_type": "Statement",
            "sentiment": parsed.get("sentiment", "Neutral"),
            "is_mapped": False,
            "category": "Statement",
            "sub_category": "Statement",
            "issue": "Statement",
            "possible_causes": [],
            "root_cause": "",
            "rca_summary": "Non-banking related message — no RCA applicable.",
            "next_steps": [],
            "confidence_score": parsed.get("confidence_score", 0.85),
        })

    # Step 2 — Fast deterministic RCA lookup
    logger.info("Step 2: RCA lookup — issue='%s' sub='%s' cat='%s'", issue, sub_category, category)
    lookup = lookup_rca(issue, sub_category, category)

    root_causes: list = lookup["root_causes"]
    actions: list = lookup["actions"]

    if root_causes or actions:
        _generic = {"human error", "system error", "operational issue", "customer request"}
        root_cause = next(
            (c for c in root_causes if c.lower() not in _generic),
            root_causes[0] if root_causes else "",
        )
        next_steps = actions
    else:
        logger.info("No lookup match — LLM fallback for cause/steps")
        fb = generate_fallback_cause_and_steps(text, category, sub_category, issue, is_complaint)
        root_cause = fb["root_cause"]
        next_steps = fb["next_steps"]
        root_causes = [root_cause]

    # Step 3 — RCA summary with KB + graph context injection
    kb_context = load_kb_context(category)
    graph_ctx = graph_context_for_issue(issue)
    rca_summary = generate_rca_summary(
        original_text=text,
        message_type=msg_type,
        category=category,
        sub_category=sub_category,
        issue=issue,
        cause=root_cause,
        next_steps=next_steps,
        kb_context=kb_context,
        graph_context=graph_ctx,
    )

    # Step 4 — Taxonomy suggestions for unmapped messages
    # Replace the placeholder "Others/Unmapped/Outside Taxonomy" with LLM-suggested values.
    # is_mapped stays False so the frontend can highlight them.
    is_mapped_final = parsed.get("is_mapped", True)
    if not is_mapped_final:
        logger.info("Step 4: Generating taxonomy suggestions for unmapped message")
        suggestions = generate_taxonomy_suggestions(text, category, issue)
        category = suggestions.get("suggested_category") or category
        sub_category = suggestions.get("suggested_sub_category") or sub_category
        issue = suggestions.get("suggested_issue") or issue

    return _build_output({
        "original_text": text,
        "translated_text": parsed.get("translated_text", ""),
        "message_type": msg_type,
        "sentiment": parsed.get("sentiment", "Neutral"),
        "is_mapped": is_mapped_final,
        "category": category,
        "sub_category": sub_category,
        "issue": issue,
        "possible_causes": root_causes,
        "root_cause": root_cause,
        "rca_summary": rca_summary,
        "next_steps": next_steps,
        "confidence_score": parsed.get("confidence_score", 0.6),
    })


def process_complaints_batch(texts: list, log_level: str = "INFO") -> list:
    logger.setLevel(log_level)
    results = []
    errors = 0

    logger.info("\n%s\nBATCH: %d messages\n%s", "=" * 60, len(texts), "=" * 60)

    for i, text in enumerate(texts, 1):
        logger.info("[%d/%d] Processing (%d chars)...", i, len(texts), len(text))
        try:
            result = process_complaint(text)
            results.append(result)
            logger.info("  %s → %s", result.get("message_type"), result.get("category"))
        except Exception as e:
            logger.error("  Exception: %s", e, exc_info=True)
            results.append({
                "message_type": "Statement",
                "is_complaint": False,
                "cause": "",
                "next_steps": [],
                "rca_summary": "Processing exception — manual review required.",
                "original_text": text,
            })
            errors += 1

    rate = (len(results) - errors) / len(results) * 100 if results else 0
    logger.info(
        "\n%s\nBATCH DONE: %d total, %d errors, %.1f%% success\n%s",
        "=" * 60, len(results), errors, rate, "=" * 60,
    )
    return results
