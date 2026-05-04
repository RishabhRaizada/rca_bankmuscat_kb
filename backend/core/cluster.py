import logging

from knowledge.kb_loader import load_kb_context
from llm.utils import safe_parse_json, call_llm_with_retry

logger = logging.getLogger(__name__)


def generate_cluster_summary(category: str, records: list) -> dict:
    """
    Generate a 9-section business analysis report for all messages
    belonging to a single category cluster.
    """
    messages = [
        (r.get("translated_text") or r.get("original_text") or "").strip()
        for r in records
    ]
    messages = [m for m in messages if len(m) > 3][:30]

    msg_type_counts: dict = {}
    for r in records:
        mt = r.get("message_type", "Unknown")
        msg_type_counts[mt] = msg_type_counts.get(mt, 0) + 1

    _skip = {"statement", "outside taxonomy", "unmapped", ""}
    issues = list(dict.fromkeys(
        r.get("issue", "") for r in records
        if r.get("issue", "").lower() not in _skip
    ))

    root_causes_raw = list(dict.fromkeys(
        r.get("root_cause", "").strip() for r in records
        if r.get("root_cause", "").strip()
    ))

    messages_text = "\n".join(f"- {m[:250]}" for m in messages)
    issues_text = "; ".join(issues[:12]) if issues else "Various"
    causes_text = "\n".join(f"- {c}" for c in root_causes_raw[:12]) if root_causes_raw else "To be determined"
    type_text = ", ".join(f"{v} {k}(s)" for k, v in msg_type_counts.items())

    # Full KB context — no truncation
    kb_context = load_kb_context(category)
    kb_section = (
        f"\nKNOWLEDGE BASE — Bank Muscat systems, procedures, SLAs, and product context:\n{kb_context}\n"
    ) if kb_context else ""

    prompt = f"""You are a senior banking operations analyst at Bank Muscat writing a formal internal business intelligence report.

Bank Muscat context:
- Bank Muscat is Oman's largest bank and positions itself as "#1 in Oman". Service failures carry significant reputational risk.
- Core banking system: T24 (Temenos). Card/payment verification: Prime (Misys/Finastra). Service requests: Additional Services Application.
- Self-service: ATMs, CDMs (Cash Deposit Machines), mBanking app (iOS/Android/Huawei), Internet Banking, bm wallet.
- Authentication: Soft Token (mobile OTP app), Secure Token (physical hardware), OTP via SMS.
- Internal teams: Back Office, CAD (Credit Administration Department), Card Services, Mailing Department, E-Channels Team, IT Team, Account Operation Team.
- Regulatory: CBO (Central Bank of Oman), KYC/Re-KYC, WPS (Wage Protection System via Sanad portal), FATCA.
- Key products: Al Mazyona (prize savings), Themaar (savings plan), Lulu Titanium Mastercard, bm wallet, Speed Transfer, Floosi (youth account), Shababi (youth account), Meethaq (Islamic banking window — Murabaha/Ijarah/Musharaka structures, Kanzu/Yaqdha cards).
- Transfer SLAs: within Bank Muscat = instant/free; other Oman bank <RO 3,000 = RO 1.0, same day before 11:44 AM; >RO 3,000 = RO 4.250; SWIFT international = same day before 14:00 (non-Eastern), next day (Eastern currencies e.g. AUD/SGD/JPY).
- Document SLAs: NOC = 5 working days; CLC = 5 working days.
- Call Centre: 24795555 (24/7).
{kb_section}
CLUSTER: "{category}" category
TOTAL MESSAGES: {len(records)} ({type_text})
KEY ISSUES IDENTIFIED: {issues_text}

CUSTOMER MESSAGES (representative sample):
{messages_text}

KNOWN ROOT CAUSES:
{causes_text}

Write a comprehensive 9-section business analysis for this cluster.
Reference Bank Muscat-specific systems (T24, Prime, Additional Services Application), teams (Back Office, CAD, Card Services, E-Channels, IT Team), products, SLAs, and procedures wherever relevant. Do not write generic banking advice — every action and finding must be grounded in Bank Muscat's actual operational context.
Return ONLY valid JSON with exactly these keys:

Severity tier definitions — pick exactly one:
  Critical: significant financial loss, regulatory breach, or mass customer impact (>30% of cluster).
  High: repeated failures, SLA risk, or reputational threat affecting multiple customers.
  Medium: operational friction or recurring complaints with moderate impact.
  Low: isolated issues with minimal business or customer impact.

Valid owner values: Contact Centre, Digital Banking, Retail Operations, IT / Technology, Compliance, Product, Risk Management, Branch Operations, Finance, Back Office, CAD, Card Services, E-Channels.

{{
  "case_summary": "2-3 sentences: what this cluster represents, case volume, nature of messages, and which Bank Muscat systems or products are involved.",
  "executive_summary": "3-4 sentences for senior management: business impact on Bank Muscat's operations, customer pain, reputational risk given Bank Muscat's #1 positioning, and urgency.",
  "symptoms": ["Distinct observable symptom referencing Bank Muscat channels/systems", "..."],
  "root_cause_analysis": "Detailed paragraph analysing root causes observed across all messages. Reference the specific Bank Muscat systems (T24, Prime, mBanking backend, ATM/CDM network, SMS gateway, Additional Services Application), teams (Back Office, CAD, Card Services, Mailing Department, E-Channels, IT), or process gaps that contributed.",
  "root_causes": ["Specific Bank Muscat root cause 1 (name the system/team/process)", "..."],
  "deep_analysis": "2-3 concise sentences covering the most significant systemic pattern: which Bank Muscat system or process is the root driver, any key interdependency or trigger (e.g. salary-cycle peak, T24/Prime mismatch), and the primary long-term risk if unaddressed.",
  "severity_tier": "Critical | High | Medium | Low",
  "severity_justification": "One sentence explaining the severity rating in the context of Bank Muscat's operations and customer base.",
  "immediate_actions": [{{"action": "Specific Bank Muscat action referencing the exact team or system to act on.", "owner": "Division name"}}],
  "short_term_actions": [{{"action": "Specific process or policy change within Bank Muscat's operational structure.", "owner": "Division name"}}],
  "strategic_actions": [{{"action": "Structural or system-level investment specific to Bank Muscat (e.g. T24 upgrade, ATM network expansion, mBanking platform overhaul).", "owner": "Division name"}}]
}}

immediate_actions: quick fixes executable within 0-2 weeks (e.g. escalate to IT Team, check T24/Prime, contact affected customers, expedite Back Office queue). Provide 2-3 actions maximum.
short_term_actions: process or policy changes requiring 1-3 months (e.g. SLA monitoring, SOP updates, branch staff training, CDM reconciliation improvements). Provide 2-3 actions maximum.
strategic_actions: structural or system-level investments requiring 3-12 months (e.g. core banking upgrades, digital channel re-architecture, CBO regulatory alignment, capacity planning for salary cycle peaks). Provide 2-3 actions maximum."""

    try:
        result = safe_parse_json(call_llm_with_retry(prompt))
        if result:
            return {
                "category": category,
                "count": len(records),
                "message_type_counts": msg_type_counts,
                "issues": issues,
                **result,
            }
    except Exception as e:
        logger.error("Cluster summary failed for '%s': %s", category, e)

    return {
        "category": category,
        "count": len(records),
        "message_type_counts": msg_type_counts,
        "issues": issues,
        "case_summary": f"{len(records)} messages classified under {category}.",
        "executive_summary": "Analysis unavailable — please retry.",
        "symptoms": [],
        "root_cause_analysis": "Analysis unavailable.",
        "root_causes": [],
        "deep_analysis": "Analysis unavailable.",
        "severity_tier": "Medium",
        "severity_justification": "Analysis unavailable.",
        "immediate_actions": [],
        "short_term_actions": [],
        "strategic_actions": [],
    }
