# LiteLLM Setup (optional)

LiteLLM is an **optional** middle layer between cc-router and Anthropic. You only need it if you want:

- Usage dashboard and per-request logging
- Rate limiting per virtual key
- Fallback to Bedrock/Vertex if Anthropic is down
- Multi-team API key management

For personal use, the standalone mode (no Docker) is simpler and works just as well.

## Prerequisites

- Docker Desktop installed and running
- cc-router configured with at least one account (`cc-router setup`)

## Quick start

```bash
# Start both cc-router and LiteLLM in Docker
cc-router docker up

# Or start LiteLLM in Docker and cc-router natively
cc-router start --litellm
```

## LiteLLM UI

Once running, the LiteLLM dashboard is at:
```
http://localhost:4000/ui
```

Default master key: `cc-router-local-dev` (set in `LITELLM_MASTER_KEY` env var or `.env`)

## Configuration

The LiteLLM config is at `litellm-config.yaml`. Key setting:

```yaml
general_settings:
  forward_client_headers_to_llm_api: true  # CRITICAL — do not remove
```

This tells LiteLLM to forward the `Authorization: Bearer <oauth-token>` header that cc-router injects. Without it, requests will fail with 401.

## Available models

| Model name | Claude version |
|------------|---------------|
| `claude-opus-4-6` | Opus 4.6 |
| `claude-sonnet-4-6` | Sonnet 4.6 |
| `claude-sonnet-4-5-20250929` | Sonnet 4.5 |
| `claude-haiku-4-5-20251001` | Haiku 4.5 |
| `claude-sonnet-4-5` | Alias → Sonnet 4.5 |
| `claude-haiku-4-5` | Alias → Haiku 4.5 |

Claude Code uses these exact model names in its requests.

## Environment variables

Create a `.env` file in the project root:

```bash
LITELLM_MASTER_KEY=your-secret-key-here
PORT=3456
LITELLM_PORT=4000
```

## Pinning a LiteLLM version

The default `docker-compose.yml` uses `main-stable`. For production, pin a specific version:

```yaml
image: ghcr.io/berriai/litellm:v1.72.0
```

Check releases at https://github.com/BerriAI/litellm/releases.

> **Warning:** LiteLLM versions 1.82.7 and 1.82.8 were found to contain credential-stealing malware. Never use those versions.

## Commands

```bash
cc-router docker up              # Start full stack
cc-router docker up --build      # Rebuild cc-router image first
cc-router docker down            # Stop containers
cc-router docker logs            # Tail all logs
cc-router docker logs --service litellm   # LiteLLM logs only
cc-router docker ps              # Container status
cc-router docker restart litellm # Restart one service
```
