# Canvas MCP

MCP server for Canvas LMS. Query courses, assignments, grades, modules, and more from any MCP client.

## Features

- List active courses
- Get assignments, grades, and submissions
- View announcements, discussions, and quizzes
- Check calendar events and todo items
- Get user profile info

## Setup

### 1. Get your Canvas API key

Go to `Canvas > Account > Settings > Approved Integrations > New Access Token`

### 2. Install

```bash
npm install
npm run build
```

### 3. Configure your MCP client

Add to your `claude_desktop_config.json` or `mcp.json`:

```json
{
  "mcpServers": {
    "canvas": {
      "command": "node",
      "args": ["/path/to/canvas-mcp/dist/standalone.js"],
      "env": {
        "CANVAS_API_KEY": "your-api-token",
        "CANVAS_BASE_URL": "https://your-canvas-instance.com"
      }
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `list_courses` | Get all active courses |
| `get_assignments` | Get assignments for a course |
| `get_upcoming_assignments` | Get upcoming assignments across all courses |
| `get_grades` | Get grades for a course |
| `get_user_profile` | Get your Canvas profile |
| `get_modules` | Get modules for a course |
| `get_announcements` | Get announcements for a course |
| `get_discussions` | Get discussion topics for a course |
| `get_calendar_events` | Get upcoming calendar events |
| `get_todo_items` | Get pending todo items |
| `get_quizzes` | Get quizzes for a course |
| `get_submission_status` | Check submission status for an assignment |

## License

MIT
