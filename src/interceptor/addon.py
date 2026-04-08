# mitmproxy addon — redirects ONLY /v1/messages traffic to CC-Router.
#
# Claude Desktop sends many types of requests to api.anthropic.com:
#   /v1/messages         → LLM inference (this is what we redirect)
#   /v1/messages/count_tokens → token counting (redirect too)
#   /v1/oauth/*          → session auth (must NOT redirect)
#   /v1/environments/*   → bridge/cowork (must NOT redirect)
#   /v1/models           → model listing (redirect — CC-Router proxies this)
#   /api/*               → desktop features (must NOT redirect)
#
# Only /v1/messages* and /v1/models are safe to redirect because CC-Router
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

# Paths that CC-Router can handle (it injects its own OAuth token)
_REDIRECT_PREFIXES = (
    "/v1/messages",
    "/v1/models",
)


def request(flow: http.HTTPFlow) -> None:
    if flow.request.pretty_host != "api.anthropic.com":
        return

    # Only redirect inference and model-listing paths
    if not flow.request.path.startswith(_REDIRECT_PREFIXES):
        return

    flow.request.scheme = _target_parsed.scheme
    flow.request.host = _target_parsed.hostname or "localhost"
    flow.request.port = _target_parsed.port or (443 if _target_parsed.scheme == "https" else 80)
    flow.request.headers["host"] = flow.request.host + (
        f":{flow.request.port}"
        if flow.request.port not in (80, 443)
        else ""
    )
