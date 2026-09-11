import { describe, expect, test } from "@jest/globals";
import { createApiClient } from "../../src/api/http";

describe("createApiClient", () => {
  test("replaces token when X-Octop-Access-Token present", async () => {
    const tokens: string[] = ["old"];
    const client = createApiClient({
      getBaseUrl: async () => "https://octop.example",
      getToken: async () => tokens[0] ?? null,
      setToken: async (t: string) => {
        tokens[0] = t;
      },
      clearToken: async () => {
        tokens.length = 0;
      },
      fetchImpl: async () =>
        new Response("{}", {
          status: 200,
          headers: { "X-Octop-Access-Token": "new", "Content-Type": "application/json" },
        }),
    });
    await client.apiRequest("/api/auth/me");
    expect(tokens[0]).toBe("new");
  });

  test("clears token and throws unauthorized on 401", async () => {
    let cleared = false;
    const client = createApiClient({
      getBaseUrl: async () => "https://octop.example",
      getToken: async () => "x",
      setToken: async () => {},
      clearToken: async () => {
        cleared = true;
      },
      fetchImpl: async () => new Response("{}", { status: 401 }),
    });
    await expect(client.apiRequest("/api/agents")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(cleared).toBe(true);
  });

  test("invokes onUnauthorized after clearing token on 401", async () => {
    let unauthorized = false;
    const client = createApiClient({
      getBaseUrl: async () => "https://octop.example",
      getToken: async () => "x",
      setToken: async () => {},
      clearToken: async () => {},
      onUnauthorized: async () => {
        unauthorized = true;
      },
      fetchImpl: async () => new Response("{}", { status: 401 }),
    });
    await expect(client.apiRequest("/api/agents")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(unauthorized).toBe(true);
  });
});
