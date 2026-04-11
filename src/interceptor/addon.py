# mitmproxy addon — redirects ONLY /v1/messages traffic to CC-Router and
# injects the proxy secret as an auth header.
#
# There are TWO cases to handle:
#
# 1. Requests to api.anthropic.com  (Claude Desktop native features)
#    → rewrite host/port to CC-Router target + inject x-api-key
#
# 2. Requests already pointed at the CC-Router target host  (Claude Code
#    inside Desktop Cowork/Agent mode, which reads ~/.claude/settings.json
#    and goes direct to ANTHROPIC_BASE_URL)
#    → inject x-api-key (no rewrite needed)
#
# Claude Desktop sends many types of requests:
#   /v1/messages         → LLM inference (redirect + auth)
#   /v1/messages/count_tokens → token counting (redirect + auth)
#   /v1/oauth/*          → session auth (must NOT touch)
#   /v1/environments/*   → bridge/cowork (must NOT touch)
#   /v1/models           → model listing (redirect + auth)
#   /api/*               → desktop features (must NOT touch)
#
# Only /v1/messages* and /v1/models are safe to touch because CC-Router
# injects its own OAuth token. Everything else carries the user's own
# session token for features CC-Router doesn't handle.

import os
from urllib.parse import urlparse

from mitmproxy import http

_target_raw = os.environ.get("CC_ROUTER_TARGET", "http://localhost:3456")
_target = _target_raw.rstrip("/")
_target_parsed = urlparse(_target)

if not _target_parsed.scheme or not _target_parsed.netloc:
    raise RuntimeError(f"CC_ROUTER_TARGET is not a valid URL: {_target_raw!r}")

_target_host = (_target_parsed.hostname or "").lower()
_target_port = _target_parsed.port or (443 if _target_parsed.scheme == "https" else 80)

# Optional proxy secret — when set, injected as x-api-key on routed requests
_secret = os.environ.get("CC_ROUTER_SECRET", "")

# Paths that CC-Router can handle (it injects its own OAuth token)
_REDIRECT_PREFIXES = (
    "/v1/messages",
    "/v1/models",
)


def request(flow: http.HTTPFlow) -> None:
    host = (flow.request.pretty_host or "").lower()
    port = flow.request.port
    is_anthropic = host == "api.anthropic.com"
    is_target = host == _target_host and port == _target_port

    # Not a host we care about — pass through untouched
    if not is_anthropic and not is_target:
        return

    # Only touch inference and model-listing paths
    if not flow.request.path.startswith(_REDIRECT_PREFIXES):
        return

    # Case 1: rewrite api.anthropic.com → CC-Router target
    if is_anthropic:
        flow.request.scheme = _target_parsed.scheme
        flow.request.host = _target_host or "localhost"
        flow.request.port = _target_port
        flow.request.headers["host"] = flow.request.host + (
            f":{flow.request.port}"
            if flow.request.port not in (80, 443)
            else ""
        )

    # Case 1 and 2: authenticate against the proxy if a secret is configured
    if _secret:
        flow.request.headers["x-api-key"] = _secret
