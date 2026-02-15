# Canvas MCP

[![Build](https://github.com/a-ariff/canvas-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/a-ariff/canvas-mcp/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.0-green.svg)](https://modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A local MCP (Model Context Protocol) server for Canvas LMS. Query your courses, assignments, grades, modules, and more from any MCP-compatible AI client — Claude Desktop, Cursor, VS Code Copilot, and others.

**Your API key stays on your machine.** Unlike hosted MCP servers that require you to hand over your Canvas credentials, this server runs locally and communicates directly with your Canvas instance.

## Architecture

```
┌─────────────────┐     stdio      ┌──────────────┐    HTTPS    ┌──────────────┐
│   MCP Client    │◄──────────────►│  Canvas MCP  │◄──────────►│  Canvas LMS  │
│ (Claude, Cursor │                │   (local)    │            │  REST API    │
│  VS Code, etc.) │                └──────────────┘            └──────────────┘
└─────────────────┘                       │
                                    API key stays
                                    on your machine
```

## Features

- **12 Canvas LMS tools** — courses, assignments, grades, modules, quizzes, and more
- **Runs locally** — your credentials never leave your machine
- **Zero config hosting** — no servers, no Cloudflare, no Docker needed
- **Works with any MCP client** — Claude Desktop, Cursor, VS Code Copilot, ChatGPT
- **TypeScript** — fully typed with Zod validation

## Quick Start

### 1. Get your Canvas API key

Go to `Canvas → Account → Settings → Approved Integrations → New Access Token`

### 2. Clone and build

```bash
git clone https://github.com/a-ariff/canvas-mcp.git
cd canvas-mcp
npm install
npm run build
```

### 3. Add to your MCP client

<details>
<summary><b>Claude Desktop</b></summary>

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "canvas": {
      "command": "node",
      "args": ["/path/to/canvas-mcp/dist/standalone.js"],
      "env": {
        "CANVAS_API_KEY": "your-canvas-api-token",
        "CANVAS_BASE_URL": "https://your-canvas-instance.edu"
      }
    }
  }
}
```
</details>

<details>
<summary><b>Cursor / VS Code</b></summary>

Add to your `.cursor/mcp.json` or VS Code MCP settings:

```json
{
  "mcpServers": {
    "canvas": {
      "command": "node",
      "args": ["/path/to/canvas-mcp/dist/standalone.js"],
      "env": {
        "CANVAS_API_KEY": "your-canvas-api-token",
        "CANVAS_BASE_URL": "https://your-canvas-instance.edu"
      }
    }
  }
}
```
</details>

### 4. Start chatting

Ask your AI assistant things like:

- "What courses am I enrolled in?"
- "What assignments are due this week?"
- "Show me my grades for IT8107"
- "Are there any new announcements?"

## Tools

| Tool | Description | Args |
|------|-------------|------|
| `list_courses` | Get all active courses | — |
| `get_assignments` | Get assignments for a course | `course_id` |
| `get_upcoming_assignments` | Upcoming assignments across all courses | — |
| `get_grades` | Grades and scores for a course | `course_id` |
| `get_user_profile` | Your Canvas profile info | — |
| `get_modules` | Course modules and structure | `course_id` |
| `get_announcements` | Recent course announcements | `course_id` |
| `get_discussions` | Discussion topics | `course_id` |
| `get_calendar_events` | Upcoming calendar events | — |
| `get_todo_items` | Pending action items | — |
| `get_quizzes` | Course quizzes | `course_id` |
| `get_submission_status` | Assignment submission status | `course_id`, `assignment_id` |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CANVAS_API_KEY` | Yes | — | Your Canvas API access token |
| `CANVAS_BASE_URL` | No | `https://canvas.instructure.com` | Your Canvas instance URL |
| `DEBUG` | No | `false` | Enable debug logging |

## Security

- **Local execution only** — the server runs on your machine via stdio
- **Direct API calls** — your Canvas API key is sent only to your Canvas instance, never to any third party
- **No data storage** — nothing is cached or persisted between sessions
- **Environment-based config** — credentials are read from environment variables, never hardcoded

## Development

```bash
# install deps
npm install

# build
npm run build

# run locally
CANVAS_API_KEY=your-token CANVAS_BASE_URL=https://your-canvas.edu npm start

# run tests
npm test

# lint
npm run lint
```

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
