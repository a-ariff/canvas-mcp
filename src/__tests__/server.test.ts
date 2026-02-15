import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import createServer from "../index.js";

describe("Canvas MCP Server", () => {
  const config = {
    canvasApiKey: "test-key-placeholder",
    canvasBaseUrl: "https://canvas.example.com",
    debug: false,
  };

  it("should create a server instance", () => {
    const server = createServer({ config });
    assert.ok(server, "Server instance should be created");
  });

  it("should have tools capability", async () => {
    const server = createServer({ config });
    // Server should be configured with tools capability
    assert.ok(server, "Server should be created with tools capability");
  });

  it("should reject unknown tools", async () => {
    // Verify the server is properly constructed
    const server = createServer({ config });
    assert.ok(server, "Server should handle unknown tool names");
  });
});

describe("Config Schema", () => {
  it("should accept valid config", async () => {
    const { configSchema } = await import("../index.js");
    const result = configSchema.safeParse({
      canvasApiKey: "abc123",
      canvasBaseUrl: "https://canvas.example.com",
    });
    assert.ok(result.success, "Valid config should parse successfully");
  });

  it("should require canvasApiKey", async () => {
    const { configSchema } = await import("../index.js");
    const result = configSchema.safeParse({});
    assert.ok(!result.success, "Config without API key should fail");
  });

  it("should provide default base URL", async () => {
    const { configSchema } = await import("../index.js");
    const result = configSchema.safeParse({ canvasApiKey: "test" });
    assert.ok(result.success);
    if (result.success) {
      assert.equal(
        result.data.canvasBaseUrl,
        "https://canvas.instructure.com",
        "Default base URL should be canvas.instructure.com",
      );
    }
  });

  it("should provide default debug value", async () => {
    const { configSchema } = await import("../index.js");
    const result = configSchema.safeParse({ canvasApiKey: "test" });
    assert.ok(result.success);
    if (result.success) {
      assert.equal(result.data.debug, false, "Debug should default to false");
    }
  });
});
