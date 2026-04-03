# CC-Router

**Round-robin proxy for multiple Claude Max accounts.**  
Distribute Claude Code requests across N subscriptions to multiply your throughput.

[![CI](https://github.com/VictorMinemu/cc-router/actions/workflows/ci.yml/badge.svg)](https://github.com/VictorMinemu/cc-router/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/cc-router)](https://www.npmjs.com/package/cc-router)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

> **Warning**  
> Read the [disclaimer](#disclaimer) before using this tool.

---

## How it works

```
Claude Code  (terminal)
     │
     │  ANTHROPIC_BASE_URL=http://localhost:3456
     │  ANTHROPIC_AUTH_TOKEN=proxy-managed
     ▼
┌─────────────────────────────────────┐
│  CC-Router  :3456                   │
│                                     │
│  1. Receives request  /v1/messages  │
│  2. Round-robin → picks account N   │
│  3. Refreshes token if expiring     │
│  4. Injects  Authorization: Bearer  │
│  5. Forwards to Anthropic (or       │
│     LiteLLM for advanced mode)      │
└──────────────┬──────────────────────┘
               │
               ▼
        api.anthropic.com
        (authenticated with
         OAuth token of account N)
```

All standard Claude Code features work transparently: streaming, extended thinking, tool use, prompt caching.

---

## Quickstart

```bash
# 1. Install
npm install -g cc-router

# 2. Wizard: extract tokens + configure Claude Code automatically
cc-router setup

# 3. Start the proxy
cc-router start

# 4. Use Claude Code normally — the proxy is transparent
claude
```

That's it. Claude Code will route through the proxy without any further changes.

**Optional:** install as a system service so it starts automatically on boot:
```bash
cc-router service install
```

---

## Installation

**Requirements:** Node.js 20 or 22.

```bash
npm install -g cc-router
```

Verify:
```bash
cc-router --version
```

---

## Setup by platform

### macOS

cc-router can extract OAuth tokens directly from the macOS Keychain — no manual copy-pasting needed.

```bash
cc-router setup
# Select "Extract automatically from macOS Keychain"
```

For multiple accounts, you need to switch accounts in Claude Code between extractions:
```bash
# Account 1 is already logged in — run setup and extract
cc-router setup

# To add account 2:
claude logout && claude login   # log in with account 2
cc-router setup --add           # extract and merge
claude logout && claude login   # log back in with account 1
```

### Linux

Tokens are read from `~/.claude/.credentials.json`:
```bash
cc-router setup
# Select "Read from ~/.claude/.credentials.json"
```

Make sure Claude Code is installed and you have run `claude login` at least once.

### Windows

Same as Linux — tokens are read from `~/.claude/.credentials.json` (Windows path: `%USERPROFILE%\.claude\.credentials.json`).

```bash
cc-router setup
```

---

## CLI Reference

```
cc-router setup              Interactive wizard: extract tokens + configure Claude Code
cc-router setup --add        Add another account to an existing configuration

cc-router start              Start proxy on localhost:3456 (foreground)
cc-router start --daemon     Start in background via PM2
cc-router start --litellm    Start with LiteLLM in Docker (advanced mode)

cc-router stop               Stop proxy + restore Claude Code to normal auth
cc-router stop --keep-config Stop proxy only (keep settings.json)
cc-router revert             Restore Claude Code to normal authentication

cc-router status             Live dashboard (updates every 2s, press q to quit)
cc-router status --json      Print current stats as JSON and exit

cc-router accounts list      List configured accounts (live stats if proxy is running)
cc-router accounts add       Add an account interactively
cc-router accounts remove <id>  Remove an account

cc-router service install    Register cc-router to start on system boot (PM2)
cc-router service uninstall  Remove from system startup
cc-router service status     Show PM2 service status
cc-router service logs       Tail proxy logs from PM2

cc-router configure          (Re)write ~/.claude/settings.json
cc-router configure --show   Show current Claude Code proxy settings
cc-router configure --remove Remove cc-router settings (same as revert without stopping)

cc-router docker up          Start full Docker stack (cc-router + LiteLLM)
cc-router docker up --build  Rebuild cc-router image before starting
cc-router docker down        Stop Docker containers
cc-router docker logs        Tail all Docker logs
cc-router docker ps          Show container status
cc-router docker restart [service]  Restart a service
```

---

## Modes of operation

### Standalone (default — no Docker)

```
Claude Code → cc-router:3456 → api.anthropic.com
```

Best for personal use. No Docker required.

```bash
cc-router start
```

### Full mode with LiteLLM (optional — requires Docker)

```
Claude Code → cc-router:3456 → LiteLLM:4000 → api.anthropic.com
```

Adds a LiteLLM layer for usage logging, rate limiting, and a web dashboard at `http://localhost:4000/ui`.

```bash
cc-router docker up
# or: cc-router start --litellm
```

See [docs/litellm-setup.md](docs/litellm-setup.md) for details.

---

## Reverting to normal Claude Code

To stop using cc-router and go back to normal Claude Code authentication:

```bash
cc-router revert
```

This stops the proxy process and removes cc-router's settings from `~/.claude/settings.json`. Claude Code will use its own authentication on the next launch.

---

## Status dashboard

```bash
cc-router status
```

```
 CC-Router  ·  standalone → api.anthropic.com  ·  up 2h 14m  ·  [q] quit

 ACCOUNTS  2/2 healthy

  ● max-account-1    ok      req   142  err   0  expires  6h 48m  last  2s ago
  ● max-account-2    ok      req   139  err   0  expires  6h 51m  last  5s ago

 TOTALS  requests 281  ·  errors 0  ·  refreshes 2

 RECENT ACTIVITY
  14:23:01  → max-account-1    route
  14:22:58  → max-account-2    route
  14:22:45  ↻ max-account-1    refresh
```

Press `q` to quit. Run with `--json` for non-interactive output.

---

## Security

- Tokens are stored locally in `~/.cc-router/accounts.json`, **never in the repository**
- The file is excluded by `.gitignore`
- Writes are atomic (write to `.tmp`, then rename) — no corruption on crash
- Keychain reads use `execFile` with a fixed argument array — no shell injection
- No telemetry, no external logging

See [docs/security.md](docs/security.md) for details.

---

## Disclaimer

> CC-Router uses the OAuth tokens of your own Claude Max subscriptions.
>
> **Read Anthropic's Terms of Service before using this tool.**  
> Using multiple Max subscriptions to increase throughput may violate the ToS. Anthropic has been known to ban accounts for unusual OAuth usage patterns.
>
> The authors are not responsible for any account bans, loss of access, or other consequences resulting from the use of this software. Use at your own risk.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

Bug reports → [GitHub Issues](https://github.com/VictorMinemu/cc-router/issues)

---

## License

[MIT](LICENSE)
