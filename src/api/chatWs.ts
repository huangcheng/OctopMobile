export function buildChatWsUrl(baseUrl: string, agentId: string, token: string): string {
  const wsBase = baseUrl.startsWith("https://")
    ? "wss://" + baseUrl.slice(8)
    : "ws://" + baseUrl.slice(7);
  return `${wsBase}/api/agents/${encodeURIComponent(agentId)}/chat/ws?token=${encodeURIComponent(token)}`;
}

export function parseWsFrame(raw: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

export type ChatWsClientOptions = {
  url: string;
  onFrame: (frame: Record<string, unknown>) => void;
  onOpen?: () => void;
  onDisconnected?: () => void;
  isForeground: () => boolean;
  getThreadId: () => string | null;
};

export type ChatWsClient = {
  send: (frame: Record<string, unknown>) => void;
  subscribe: (threadId: string) => void;
  reconnect: () => void;
  close: () => void;
};

export function createChatWsClient(options: ChatWsClientOptions): ChatWsClient {
  let ws: WebSocket | null = null;
  let expectedClose = false;
  let autoReconnectUsed = false;
  let pendingSubscribe: string | null = null;

  function send(frame: Record<string, unknown>): void {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(frame));
    }
  }

  function subscribe(threadId: string): void {
    pendingSubscribe = threadId;
    send({ type: "subscribe", thread_id: threadId });
  }

  function openSocket(): void {
    ws = new WebSocket(options.url);

    ws.onopen = () => {
      options.onOpen?.();
      if (pendingSubscribe) {
        send({ type: "subscribe", thread_id: pendingSubscribe });
      }
    };

    ws.onmessage = (event) => {
      const frame = parseWsFrame(String(event.data));
      if (frame) {
        options.onFrame(frame);
      }
    };

    ws.onclose = () => {
      ws = null;
      if (expectedClose) {
        return;
      }

      if (options.isForeground() && !autoReconnectUsed) {
        autoReconnectUsed = true;
        const threadId = options.getThreadId();
        if (threadId) {
          pendingSubscribe = threadId;
        }
        openSocket();
        return;
      }

      options.onDisconnected?.();
    };

    ws.onerror = () => {
      // Close handler performs reconnect / disconnected signaling.
    };
  }

  function reconnect(): void {
    expectedClose = false;
    autoReconnectUsed = false;
    const threadId = options.getThreadId();
    if (threadId) {
      pendingSubscribe = threadId;
    }
    if (ws) {
      ws.close();
      ws = null;
    }
    openSocket();
  }

  function close(): void {
    expectedClose = true;
    ws?.close();
    ws = null;
  }

  openSocket();

  return { send, subscribe, reconnect, close };
}
