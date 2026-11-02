"""
Domain licensing — checks if a request origin is allowed for a given bot.

Supports:
  - Exact match: "example.com"
  - Wildcard: "*.example.com" matches any subdomain
  - Empty/null allowed_domains → blocked everywhere
"""

import json
from urllib.parse import urlparse


def _extract_hostname(origin: str) -> str:
    """Extract hostname from Origin or Referer header."""
    if not origin:
        return ""
    # Origin is usually "https://example.com" (no path)
    # Referer is "https://example.com/page?q=1"
    if "://" not in origin:
        origin = "http://" + origin
    parsed = urlparse(origin)
    return (parsed.hostname or "").lower()


def _matches_pattern(hostname: str, pattern: str) -> bool:
    """Check if hostname matches a domain pattern (exact or wildcard)."""
    pattern = pattern.lower().strip()
    if not pattern:
        return False

    if pattern.startswith("*."):
        # Wildcard: *.example.com matches sub.example.com, a.b.example.com
        suffix = pattern[1:]  # ".example.com"
        return hostname == pattern[2:] or hostname.endswith(suffix)
    else:
        # Exact match
        return hostname == pattern


def is_origin_allowed(allowed_domains_json: str | None, origin: str) -> bool:
    """
    Check if the request origin is allowed.

    Args:
        allowed_domains_json: JSON string of allowed domains from DB, or None
        origin: Origin or Referer header value

    Returns:
        True if allowed, False if blocked
    """
    # No domains configured → blocked everywhere
    if not allowed_domains_json:
        return False

    try:
        domains = json.loads(allowed_domains_json)
    except (json.JSONDecodeError, TypeError):
        return False

    if not domains or not isinstance(domains, list):
        return False

    hostname = _extract_hostname(origin)
    if not hostname:
        return False

    return any(_matches_pattern(hostname, pattern) for pattern in domains)


def get_request_origin(request) -> str:
    """Extract origin from a FastAPI Request (Origin header, fallback to Referer)."""
    origin = request.headers.get("origin", "")
    if not origin:
        origin = request.headers.get("referer", "")
    return origin
