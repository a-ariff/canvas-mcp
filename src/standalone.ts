#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import createServer from "./index.js";

const config = {
  canvasApiKey: process.env.CANVAS_API_KEY || "",
  canvasBaseUrl:
    process.env.CANVAS_BASE_URL || "https://canvas.instructure.com",
  debug: process.env.DEBUG === "true",
};

if (!config.canvasApiKey) {
  console.error(
    "Warning: CANVAS_API_KEY not set. Tools will fail without it.",
  );
}

async function main() {
  const server = createServer({ config });
  const transport = new StdioServerTransport();
  await server.connect(transport);

  if (config.debug) {
    console.error("Canvas MCP running on stdio");
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
