import logging

from taxonomy import RCA_TAXONOMY

logger = logging.getLogger(__name__)

# Built once at import time so the LLM API can cache this exact string server-side.
# Cache TTL = 5 min
_TAXONOMY_TEXT = "\n".join(
    f"{t['category']} | {t['sub_category']} | {t['issue']}"
    for t in RCA_TAXONOMY
)

STEP1_STATIC_PROMPT = f"""Return ONLY valid JSON. Do not include explanation or markdown.

You are a banking customer intelligence system processing social media messages for Bank Muscat.

TASK: Classify the message, then map it to the taxonomy below.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — CLASSIFY INTO EXACTLY ONE TYPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before classifying, apply the TICKET TEST:
  "Could a bank agent open a support ticket and take a specific action to resolve
   this exact issue for this specific customer?"
  YES → likely a Complaint.  NO → likely a Statement.

──────────────────────────────────────────
A. COMPLAINT
──────────────────────────────────────────
A customer is reporting THEIR OWN direct experience with a specific Bank Muscat
product or service failure that a bank agent can investigate and resolve.

ALL THREE must be true:
  1. Specific problem — a clear, identifiable banking failure or error (not just
     general frustration or vague criticism)
  2. Personal experience — the customer is the directly affected party
     (not hearsay, not a third-party report, not a general observation)
  3. Actionable — a bank agent can take a concrete step to fix or investigate it

→ message_type="Complaint", is_complaint=true

Examples that ARE Complaints:
  • "My salary was not credited to my account today"
  • "My mBanking transfer of RO 200 failed but the amount was debited"
  • "My debit card was declined at the ATM three times"
  • "I have been waiting at the branch for 2 hours and no one is helping me"
  • "I requested a cheque book 3 weeks ago and still haven't received it"

──────────────────────────────────────────
B. INQUIRY
──────────────────────────────────────────
A customer is asking a specific question about Bank Muscat products, services,
fees, eligibility, or processes — they want information, not a problem fixed.

→ message_type="Inquiry", is_complaint=false

Examples that ARE Inquiries:
  • "What is the SWIFT code for Bank Muscat?"
  • "How do I apply for a credit card?"
  • "What are the transfer fees to India?"
  • "Can I open an account online?"

──────────────────────────────────────────
C. STATEMENT
──────────────────────────────────────────
Everything that fails the ticket test. This includes:
  • Vague or general criticism with no specific resolvable issue
    ("Bank Muscat's service is terrible", "your app is always slow")
  • Praise, greetings, or positive feedback
  • News articles, press releases, promotional posts, advertisements
  • Third-party observations or hearsay
    ("I heard people are having problems with the app")
  • Someone asking others for opinions or experiences (poll-type posts)
  • Rants or emotional expressions without a specific banking problem
  • Non-banking content

→ message_type="Statement", is_complaint=false
→ category="Statement", sub_category="Statement", issue="Statement"

Examples that ARE Statements (NOT Complaints):
  • "Bank Muscat is the worst bank in Oman" — vague, no specific issue
  • "@bankmuscat your app is always crashing" — chronic vague complaint, no specific incident
  • "Has anyone else had problems with Bank Muscat lately?" — asking others, not reporting own issue
  • "Bank Muscat opened a new branch in Muscat" — news/announcement
  • "I love Bank Muscat's new mobile app design" — praise

CRITICAL RULE: A @mention or hashtag does NOT make a message a Complaint.
Only classify as Complaint if ALL THREE criteria above are met.
When in doubt between Complaint and Statement, ask: is there a specific
incident a bank agent could investigate today? If no → Statement.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — IF Complaint OR Inquiry → MAP TO TAXONOMY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Taxonomy (category | sub_category | issue):
{_TAXONOMY_TEXT}

Rules:
- Match sub_category first, then category
- Use semantic meaning, not exact words
- Pick the most specific match
- If no match: category="Others", sub_category="Unmapped", issue="Outside Taxonomy", is_mapped=false

RETURN FORMAT:
{{
  "message_type": "Complaint" | "Inquiry" | "Statement",
  "is_complaint": true | false,
  "complaint_summary": "One sentence summary (empty for Statement)",
  "sentiment": "Positive" | "Neutral" | "Negative",
  "category": "...",
  "sub_category": "...",
  "issue": "...",
  "is_mapped": true | false,
  "confidence_score": 0-1,
  "source_language": "Arabic" | "English",
  "translated_text": "English translation or same as input"
}}"""


def log_cache_usage(usage: dict) -> None:
    read = usage.get("cache_read_input_tokens", 0)
    write = usage.get("cache_creation_input_tokens", 0)
    inp = usage.get("input_tokens", 0)
    out = usage.get("output_tokens", 0)

    if read:
        logger.info(
            "Step 1 cache HIT  — read=%d (×0.10) | fresh=%d (×1.00) | out=%d",
            read, inp, out,
        )
    elif write:
        logger.info(
            "Step 1 cache MISS — written=%d (×1.25) | fresh=%d (×1.00) | out=%d  [cache populated]",
            write, inp, out,
        )
    else:
        logger.info("Step 1 tokens — input=%d | output=%d (no cache info)", inp, out)


def normalize_classification(parsed: dict) -> dict:
    """
    Coerce LLM classification output into a consistent shape.
    Never raises, never fails.
    """
    msg_type = parsed.get("message_type", "") or ""

    _aliases = {
        "complaint": "Complaint", "issue": "Complaint",
        "inquiry": "Inquiry", "question": "Inquiry", "enquiry": "Inquiry",
        "statement": "Statement", "non-banking": "Statement", "other": "Statement",
    }
    if msg_type not in {"Complaint", "Inquiry", "Statement"}:
        msg_type = _aliases.get(msg_type.lower().strip(), "Statement")
    parsed["message_type"] = msg_type

    parsed["is_complaint"] = (msg_type == "Complaint")

    if msg_type == "Statement":
        parsed["category"] = "Statement"
        parsed["sub_category"] = "Statement"
        parsed["issue"] = "Statement"
        parsed["is_mapped"] = False
        parsed["complaint_summary"] = ""

    if parsed.get("issue") in ("Not a Complaint", "not a complaint"):
        parsed["issue"] = "Outside Taxonomy"
        parsed["is_mapped"] = False
    if parsed.get("issue") == "Outside Taxonomy":
        parsed["is_mapped"] = False

    conf = parsed.get("confidence_score")
    if not isinstance(conf, (int, float)) or not (0.0 <= conf <= 1.0):
        parsed["confidence_score"] = 0.85 if msg_type == "Statement" else 0.6

    parsed.setdefault("sentiment", "Neutral")
    parsed.setdefault("translated_text", "")
    parsed.setdefault("is_mapped", msg_type != "Statement")

    return parsed
