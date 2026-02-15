# Security Policy

## Why This Server Exists

Most Canvas LMS MCP integrations require you to send your Canvas API token to a third-party server. Your credentials pass through infrastructure you don't control, operated by people you don't know.

**This server takes a different approach.** It runs entirely on your local machine. Your Canvas API key is read from a local environment variable and sent only to your own Canvas instance over HTTPS. No intermediary, no third-party storage, no trust required.

## How Credentials Are Handled

| Aspect | This Server | Hosted MCP Servers |
|--------|------------|-------------------|
| Where API key is stored | Your local env vars | Third-party server |
| Where API key is sent | Your Canvas instance only | Third-party server → Canvas |
| Who can see your key | Only you | Server operator |
| Data persistence | None — stateless | Unknown |
| Network path | Your machine → Canvas | Your machine → Third party → Canvas |

## Design Principles

1. **Zero trust architecture** — the server never stores, logs, or forwards your credentials
2. **Direct communication** — API calls go straight from your machine to Canvas over HTTPS
3. **Stateless operation** — nothing persists between sessions. No databases, no caches, no files
4. **Minimal dependencies** — only `@modelcontextprotocol/sdk` and `zod`. Fewer dependencies = smaller attack surface
5. **Input validation** — all tool arguments are validated with Zod schemas before use
6. **No network listeners** — stdio transport means no open ports, no HTTP server, no attack surface

## What We Don't Do

- ❌ Store your API key anywhere
- ❌ Send your credentials to any server other than your Canvas instance
- ❌ Log API responses or personal data
- ❌ Cache course data between sessions
- ❌ Open network ports or run an HTTP server
- ❌ Phone home or collect analytics

## Reporting a Vulnerability

If you find a security issue, please email the maintainer directly instead of opening a public issue. Include:

- Description of the vulnerability
- Steps to reproduce
- Impact assessment

## Recommendations

- **Rotate your Canvas API key regularly** — generate a new token and revoke old ones
- **Use scoped tokens** — if your Canvas instance supports it, limit the token to read-only access
- **Don't commit `.env` files** — the `.gitignore` already excludes them, but double-check
- **Keep dependencies updated** — run `npm audit` periodically
