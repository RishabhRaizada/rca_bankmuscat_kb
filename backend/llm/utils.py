import json
import logging
import re
import time

from llm.client import call_llm

logger = logging.getLogger(__name__)


def safe_parse_json(response: str) -> dict | None:
    """
    Parse JSON from an LLM response string.
    Returns None when parsing fails so callers can decide what fallback to apply.
    """
    if not response or not response.strip():
        return None
    try:
        return json.loads(response)
    except Exception:
        match = re.search(r"\{.*\}", response, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except Exception:
                pass
    return None


def call_llm_with_retry(prompt: str, max_retries: int = 2, initial_wait: float = 1.0) -> str:
    for attempt in range(max_retries):
        try:
            return call_llm(prompt)
        except Exception as e:
            if attempt == max_retries - 1:
                logger.error("LLM call failed after %d attempts: %s", max_retries, e)
                raise
            wait = initial_wait * (2 ** attempt)
            logger.warning("LLM attempt %d/%d failed, retrying in %.1fs: %s", attempt + 1, max_retries, wait, e)
            time.sleep(wait)
