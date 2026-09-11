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

export type ConnectDeduper = {
  run<T>(fn: () => Promise<T>): Promise<T>;
  reset: () => void;
};

export function createConnectDeduper(): ConnectDeduper {
  let inFlight: Promise<unknown> | null = null;

  return {
    run<T>(fn: () => Promise<T>): Promise<T> {
      if (inFlight) {
        return inFlight as Promise<T>;
      }

      inFlight = fn().finally(() => {
        inFlight = null;
      });
      return inFlight as Promise<T>;
    },
    reset() {
      inFlight = null;
    },
  };
}

export type ChatWsClientOptions = {
  url: string;
  onFrame: (frame: Record<string, unknown>) => void;
  onOpen?: () => void;
  onDisconnected?: () => void;
  isForeground: () => boolean;
  getThreadId: () => string | null;
  WebSocketImpl?: typeof WebSocket;
};

export type ChatWsClient = {
  send: (frame: Record<string, unknown>) => void;
  subscribe: (threadId: string) => void;
  reconnect: () => void;
  close: () => void;
};

export function createChatWsClient(options: ChatWsClientOptions): ChatWsClient {
  const WebSocketImpl = options.WebSocketImpl ?? WebSocket;
  let ws: WebSocket | null = null;
  let expectedClose = false;
  let autoReconnectUsed = false;
  let pendingSubscribe: string | null = null;
  const outboundQueue: Record<string, unknown>[] = [];

  function flushQueue(): void {
    if (ws?.readyState !== WebSocketImpl.OPEN) {
      return;
    }

    while (outboundQueue.length > 0) {
      ws.send(JSON.stringify(outboundQueue.shift()));
    }
  }

  function send(frame: Record<string, unknown>): void {
    if (ws?.readyState === WebSocketImpl.OPEN) {
      ws.send(JSON.stringify(frame));
      return;
    }

    outboundQueue.push(frame);
  }

  function subscribe(threadId: string): void {
    pendingSubscribe = threadId;
    if (ws?.readyState === WebSocketImpl.OPEN) {
      ws.send(JSON.stringify({ type: "subscribe", thread_id: threadId }));
    }
  }

  function openSocket(): void {
    const socket = new WebSocketImpl(options.url);
    ws = socket;

    socket.onopen = () => {
      if (ws !== socket) {
        return;
      }
      options.onOpen?.();
      flushQueue();
      if (pendingSubscribe && ws?.readyState === WebSocketImpl.OPEN) {
        ws.send(JSON.stringify({ type: "subscribe", thread_id: pendingSubscribe }));
      }
    };

    socket.onmessage = (event) => {
      if (ws !== socket) {
        return;
      }
      const frame = parseWsFrame(String(event.data));
      if (frame) {
        options.onFrame(frame);
      }
    };

    socket.onclose = () => {
      if (ws !== socket) {
        return;
      }
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

    socket.onerror = () => {
      // Close handler performs reconnect / disconnected signaling.
    };
  }

  function reconnect(): void {
    autoReconnectUsed = false;
    const threadId = options.getThreadId();
    if (threadId) {
      pendingSubscribe = threadId;
    }
    if (ws) {
      expectedClose = true;
      ws.close();
    }
    expectedClose = false;
    openSocket();
  }

  function close(): void {
    expectedClose = true;
    outboundQueue.length = 0;
    ws?.close();
    ws = null;
  }

  openSocket();

  return { send, subscribe, reconnect, close };
}
