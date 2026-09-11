import { afterEach, describe, expect, jest, test } from "@jest/globals";

import { createChatWsClient, createConnectDeduper } from "../../src/api/chatWs";

type MockWebSocketInstance = {
  url: string;
  readyState: number;
  sent: string[];
  onopen: (() => void) | null;
  onclose: (() => void) | null;
  onmessage: ((event: { data: string }) => void) | null;
  onerror: (() => void) | null;
  send: (data: string) => void;
  close: () => void;
  simulateOpen: () => void;
};

const CONNECTING = 0;
const OPEN = 1;

function createMockWebSocketClass() {
  const instances: MockWebSocketInstance[] = [];

  class MockWebSocket {
    static CONNECTING = CONNECTING;
    static OPEN = OPEN;

    url: string;
    readyState = CONNECTING;
    sent: string[] = [];
    onopen: (() => void) | null = null;
    onclose: (() => void) | null = null;
    onmessage: ((event: { data: string }) => void) | null = null;
    onerror: (() => void) | null = null;

    constructor(url: string) {
      this.url = url;
      const self = this;
      instances.push({
        get url() {
          return self.url;
        },
        get readyState() {
          return self.readyState;
        },
        get sent() {
          return self.sent;
        },
        get onopen() {
          return self.onopen;
        },
        set onopen(handler) {
          self.onopen = handler;
        },
        get onclose() {
          return self.onclose;
        },
        set onclose(handler) {
          self.onclose = handler;
        },
        get onmessage() {
          return self.onmessage;
        },
        set onmessage(handler) {
          self.onmessage = handler;
        },
        get onerror() {
          return self.onerror;
        },
        set onerror(handler) {
          self.onerror = handler;
        },
        send(data: string) {
          self.sent.push(data);
        },
        close() {
          self.readyState = 3;
          self.onclose?.();
        },
        simulateOpen() {
          self.readyState = OPEN;
          self.onopen?.();
        },
      });
    }

    send(data: string): void {
      this.sent.push(data);
    }

    close(): void {
      this.readyState = 3;
      this.onclose?.();
    }
  }

  return { MockWebSocket, instances };
}

describe("createChatWsClient", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("queues outbound frames until socket opens", () => {
    const { MockWebSocket, instances } = createMockWebSocketClass();
    const client = createChatWsClient({
      url: "ws://example.test/ws",
      onFrame: () => {},
      isForeground: () => true,
      getThreadId: () => "thread-1",
      WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
    });

    client.send({ type: "user_turn", text: "hello", thread_id: "thread-1" });
    expect(instances[0]?.sent).toHaveLength(0);

    instances[0]?.simulateOpen();
    expect(instances[0]?.sent).toEqual([
      JSON.stringify({ type: "user_turn", text: "hello", thread_id: "thread-1" }),
    ]);

    client.close();
  });

  test("subscribe before open sends subscribe once on open", () => {
    const { MockWebSocket, instances } = createMockWebSocketClass();
    const client = createChatWsClient({
      url: "ws://example.test/ws",
      onFrame: () => {},
      isForeground: () => true,
      getThreadId: () => null,
      WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
    });

    client.subscribe("thread-9");
    instances[0]?.simulateOpen();

    const subscribeFrames = instances[0]?.sent.filter((payload) => {
      return JSON.parse(payload).type === "subscribe";
    });
    expect(subscribeFrames).toEqual([JSON.stringify({ type: "subscribe", thread_id: "thread-9" })]);

    client.close();
  });
});

describe("createConnectDeduper", () => {
  test("deduplicates concurrent connect calls", async () => {
    const deduper = createConnectDeduper();
    let connectCount = 0;

    const connect = async () => {
      connectCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return `client-${connectCount}`;
    };

    const [first, second] = await Promise.all([deduper.run(connect), deduper.run(connect)]);

    expect(connectCount).toBe(1);
    expect(first).toBe("client-1");
    expect(second).toBe("client-1");
  });
});
