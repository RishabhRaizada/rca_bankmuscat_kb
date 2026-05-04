import logging
import os

logger = logging.getLogger(__name__)

_KB_DIR = os.path.join(os.path.dirname(__file__), "..", "knowledge_base")

_SHARED_KB_FILES = [
    "_shared/systems_glossary.md",
    "_shared/root_cause_definitions.md",
]

_CATEGORY_KB_MAP: dict[str, str] = {
    # Mobile / Digital
    "Mobile Banking": "mobile_banking.md",
    "BM Apps": "mobile_banking.md",
    "Internet Banking Services": "internet_banking_services.md",
    "Apple Pay": "apple_pay.md",
    # Cards
    "Credit Card": "credit_card.md",
    # Devices
    "Bank Muscat Devices": "bank_muscat_devices.md",
    "Gcc Bank Devices": "gcc_bank_devices.md",
    "GCC Bank Devices": "gcc_bank_devices.md",
    # Transfers
    "International Transfers": "international_transfers.md",
    "Own Accounts": "own_accounts.md",
    # Accounts & Deposits
    "Current Account": "current_account.md",
    "Savings Account": "savings_account.md",
    "Savings Plan": "savings_account.md",
    "Fixed Deposit": "fixed_deposit.md",
    # Finance
    "Home Finance": "home_finance.md",
    "Auto Finance": "auto_finance.md",
    "Meethaq": "meethaq.md",
    "Meethaq Cheques": "meethaq.md",
    # Customer Management
    "Customer Details": "customer_details.md",
    # Notifications & Statements
    "Notification": "notifications.md",
    "Notifications": "notifications.md",
    "Statements": "statements.md",
    "Statement": "statements.md",
    # Branch Operations
    "Queue System": "queue_system.md",
    "File Upload Related Issues": "file_upload.md",
    # Enquiries
    "Enquiry": "enquiry.md",
}


def _read_kb_file(relative_path: str) -> str:
    filepath = os.path.join(_KB_DIR, relative_path)
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        logger.warning("KB file not found: %s", filepath)
        return ""
    except Exception as e:
        logger.warning("Failed to read KB file %s: %s", filepath, e)
        return ""


def load_kb_context(category: str) -> str:
    """Load shared glossary + category-specific KB for injection into LLM prompts."""
    parts = []

    shared = "\n\n".join(_read_kb_file(f) for f in _SHARED_KB_FILES)
    if shared.strip():
        parts.append(shared)

    filename = _CATEGORY_KB_MAP.get(category, "")
    if not filename:
        category_lower = category.lower()
        for key, val in _CATEGORY_KB_MAP.items():
            if key.lower() == category_lower:
                filename = val
                break

    if filename:
        category_kb = _read_kb_file(filename)
        if category_kb.strip():
            parts.append(category_kb)

    return "\n\n---\n\n".join(parts)
