import { describe, expect, test } from "@jest/globals";

import { buildChatWsUrl } from "../../src/api/chatWs";

describe("buildChatWsUrl", () => {
  test("maps https base to wss path with token query", () => {
    expect(buildChatWsUrl("https://octop.example", "agent-1", "jwt")).toBe(
      "wss://octop.example/api/agents/agent-1/chat/ws?token=jwt",
    );
  });

  test("maps http base to ws", () => {
    expect(buildChatWsUrl("http://192.168.1.5:8000", "a", "t")).toBe(
      "ws://192.168.1.5:8000/api/agents/a/chat/ws?token=t",
    );
  });
});
