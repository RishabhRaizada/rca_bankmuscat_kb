import json
import logging
import os

from anthropic import AnthropicVertex, APIConnectionError, APITimeoutError, RateLimitError
from dotenv import load_dotenv
from google.oauth2 import service_account
from tenacity import (
    before_sleep_log,
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

load_dotenv()

logger = logging.getLogger(__name__)

# Resolve key.json relative to the project root (two levels up from this file)
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_raw_key_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "./key.json")
SERVICE_ACCOUNT_FILE = (
    _raw_key_path
    if os.path.isabs(_raw_key_path)
    else os.path.join(_PROJECT_ROOT, _raw_key_path.lstrip("./\\"))
)

LOCATION = os.getenv("VERTEX_LOCATION", "us-east5")
MODEL_NAME = os.getenv("VERTEX_MODEL", "claude-sonnet-4-5")

logger.info(
    "LLM config: model=%s location=%s key=%s exists=%s",
    MODEL_NAME, LOCATION, SERVICE_ACCOUNT_FILE, os.path.exists(SERVICE_ACCOUNT_FILE),
)


def get_project_id() -> str:
    try:
        with open(SERVICE_ACCOUNT_FILE, "r") as f:
            data = json.load(f)
        project_id = data.get("project_id")
        if not project_id:
            raise ValueError("project_id not found in key.json")
        return project_id
    except Exception as e:
        raise RuntimeError(f"Error reading project_id: {e}")


def _make_client() -> AnthropicVertex:
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE,
        scopes=["https://www.googleapis.com/auth/cloud-platform"],
    )
    return AnthropicVertex(
        project_id=get_project_id(),
        region=LOCATION,
        credentials=credentials,
    )


# Retries only on transient errors — rate limits, timeouts, dropped connections.
# AuthenticationError and other permanent failures are NOT retried (they won't self-heal).
# Waits: 1 s → 2 s → 4 s (capped at 8 s) between attempts.
@retry(
    retry=retry_if_exception_type((RateLimitError, APITimeoutError, APIConnectionError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=8),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True,
)
def _create_message(client: AnthropicVertex, **kwargs):
    return client.messages.create(**kwargs)


def call_llm(prompt: str) -> str:
    try:
        client = _make_client()
        response = _create_message(
            client,
            model=MODEL_NAME,
            max_tokens=4096,
            temperature=0.2,
            messages=[{
                "role": "user",
                "content": f"Return ONLY valid JSON. Do not include explanation or markdown.\n\n{prompt}",
            }],
        )
        if response.content:
            return "".join(
                block.text for block in response.content if hasattr(block, "text")
            ).strip()
        logger.warning("LLM returned empty content block")
        return ""
    except Exception as e:
        logger.error("Vertex LLM error: %s", e)
        return ""


def call_llm_cached(static_prompt: str, dynamic_text: str) -> tuple[str, dict]:
    """
    Call the LLM with prompt caching on the static portion.

    Cache HIT  → static tokens cost 10 % of normal price.
    Cache MISS → static tokens written to cache at 125 % of normal price.
    Cache TTL  = 5 minutes.

    Retries up to 3 times on rate-limit / timeout / connection errors before
    falling back to a non-cached call, then returns empty string on total failure.

    Returns (response_text, usage_dict).
    """
    try:
        client = _make_client()
        response = _create_message(
            client,
            model=MODEL_NAME,
            max_tokens=4096,
            temperature=0.2,
            extra_headers={"anthropic-beta": "prompt-caching-2024-07-31"},
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": static_prompt, "cache_control": {"type": "ephemeral"}},
                    {"type": "text", "text": dynamic_text},
                ],
            }],
        )
        text = "".join(
            block.text for block in response.content if hasattr(block, "text")
        ).strip()
        usage = {
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
            "cache_creation_input_tokens": getattr(response.usage, "cache_creation_input_tokens", 0) or 0,
            "cache_read_input_tokens": getattr(response.usage, "cache_read_input_tokens", 0) or 0,
        }
        return text, usage
    except Exception as e:
        logger.error("Cached LLM call failed after retries, falling back to standard call: %s", e)
        fallback = call_llm(f"{static_prompt}\n\n{dynamic_text}")
        return fallback, {
            "input_tokens": 0, "output_tokens": 0,
            "cache_creation_input_tokens": 0, "cache_read_input_tokens": 0,
        }
