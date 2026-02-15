# Contributing

Thanks for your interest in contributing!

## Getting Started

1. Fork and clone the repo
2. Install dependencies: `npm install`
3. Build: `npm run build`
4. Run tests: `npm test`

## Making Changes

1. Create a branch: `git checkout -b my-feature`
2. Make your changes
3. Run the build and tests to make sure everything passes
4. Commit with a clear message
5. Push and open a PR

## Adding a New Tool

To add a new Canvas LMS tool:

1. Add the API method to the `CanvasAPI` class in `src/index.ts`
2. Add the tool definition in the `ListToolsRequestSchema` handler
3. Add the tool handler in the `CallToolRequestSchema` switch block
4. Add a formatter function for the response
5. Update the README tool table

## Code Style

- TypeScript strict mode
- Use Zod for input validation
- Handle errors gracefully — never crash the MCP connection
- Format responses with emoji prefixes for readability

## Reporting Issues

Open an issue with:
- What you expected to happen
- What actually happened
- Your Canvas instance URL (not your API key!)
- Node.js version
