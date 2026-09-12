import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import {
  buildChatWsUrl,
  createChatWsClient,
  createConnectDeduper,
  type ChatWsClient,
} from "../../api/chatWs";
import { getThreadHistory } from "../../api/threads";
import type { HistoryMessage, MessageContentBlock } from "../../api/types";
import { t } from "../../i18n";
import { getToken } from "../../storage/secure";
import {
  applyToolFrame,
  EMPTY_TOOL_FRAME_STATE,
  type ToolFrameState,
} from "../../utils/processFrames";
import { useAuth } from "../auth/AuthContext";

export type ChatDisplayMessage = {
  role: "user" | "assistant";
  content: string;
};

/** Process-card data (design 15): tool calls + deep-thinking signals during a turn. */
export type ProcessItem = {
  id: string;
  kind: "tool" | "thinking";
  name: string;
  detail: string;
  /** Tool output preview, rendered inside the row under the call. */
  result?: string;
  status: "running" | "done" | "error";
};

export type ProcessState = {
  items: ProcessItem[];
  toolCount: number;
  thinkingCount: number;
};

const EMPTY_PROCESS: ProcessState = { items: [], toolCount: 0, thinkingCount: 0 };

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function mergeProcessItem(prev: ProcessState, item: ProcessItem): ProcessState {
  const existing = prev.items.find((candidate) => candidate.id === item.id);
  const items = existing
    ? prev.items.map((candidate) => (candidate.id === item.id ? item : candidate))
    : [...prev.items, item];
  return {
    items,
    toolCount: items.filter((candidate) => candidate.kind === "tool").length,
    thinkingCount: items.filter((candidate) => candidate.kind === "thinking").length,
  };
}

const HISTORY_RETRY_CAP = 10;
const DEFAULT_HISTORY_RETRY_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function flattenMessageContent(content: string | MessageContentBlock[]): string {
  if (typeof content === "string") {
    return content;
  }

  return content
    .map((block) => {
      if (typeof block.text === "string") {
        return block.text;
      }
      if (block.type === "text" && typeof block.content === "string") {
        return block.content;
      }
      return "";
    })
    .join("");
}

function historyToDisplayMessages(messages: HistoryMessage[]): ChatDisplayMessage[] {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      role: message.role as "user" | "assistant",
      content: flattenMessageContent(message.content),
    }))
    .filter((message) => message.content.length > 0);
}

type UseChatTurnOptions = {
  agentId: string | null;
  threadId: string;
};

export function useChatTurn({ agentId, threadId }: UseChatTurnOptions) {
  const { baseUrl, api } = useAuth();
  const [messages, setMessages] = useState<ChatDisplayMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [working, setWorking] = useState(false);
  const [turnActive, setTurnActive] = useState(false);
  const [disconnected, setDisconnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [process, setProcess] = useState<ProcessState>(EMPTY_PROCESS);
  const toolFrameRef = useRef<ToolFrameState>(EMPTY_TOOL_FRAME_STATE);

  const wsRef = useRef<ChatWsClient | null>(null);
  const connectDeduperRef = useRef(createConnectDeduper());
  const foregroundRef = useRef(AppState.currentState === "active");
  const streamingTextRef = useRef("");
  const threadIdRef = useRef(threadId);
  const turnActiveRef = useRef(false);

  threadIdRef.current = threadId;
  streamingTextRef.current = streamingText;
  turnActiveRef.current = turnActive;

  const finalizeAssistantTurn = useCallback((text: string) => {
    const trimmed = text.trim();
    if (trimmed) {
      setMessages((prev) => [...prev, { role: "assistant", content: trimmed }]);
    }
    setStreamingText("");
    streamingTextRef.current = "";
    setWorking(false);
    setTurnActive(false);
    turnActiveRef.current = false;
  }, []);

  const appendStreamChunk = useCallback((chunk: string) => {
    if (!chunk) {
      return;
    }
    setStreamingText((prev) => {
      const next = prev + chunk;
      streamingTextRef.current = next;
      return next;
    });
    setWorking(false);
    setTurnActive(true);
    turnActiveRef.current = true;
  }, []);

  const handleFrame = useCallback(
    (frame: Record<string, unknown>) => {
      const type = typeof frame.type === "string" ? frame.type : "";

      switch (type) {
        case "token":
        case "text":
        case "delta": {
          // Octop harness tokens use `content`; tolerate `text` / `delta` aliases.
          const chunk =
            (typeof frame.content === "string" && frame.content) ||
            (typeof frame.text === "string" && frame.text) ||
            (typeof frame.delta === "string" && frame.delta) ||
            "";
          appendStreamChunk(chunk);
          break;
        }
        case "done":
          finalizeAssistantTurn(streamingTextRef.current);
          break;
        case "error": {
          const message = typeof frame.message === "string" ? frame.message : "Error";
          setError(message);
          finalizeAssistantTurn(streamingTextRef.current);
          break;
        }
        case "turn_status":
          if (typeof frame.active === "boolean") {
            setTurnActive(frame.active);
            turnActiveRef.current = frame.active;
            if (!frame.active && streamingTextRef.current) {
              finalizeAssistantTurn(streamingTextRef.current);
            }
          }
          break;
        case "pong":
          break;
        default: {
          // Non-text stream events: tool-call CHUNKS accumulate into one row
          // per tool call (utils/processFrames); results attach inside the row.
          const lower = type.toLowerCase();
          if (lower.startsWith("tool")) {
            const next = applyToolFrame(toolFrameRef.current, frame);
            toolFrameRef.current = next;
            setProcess((prev) => ({
              ...prev,
              items: [
                ...next.rows.map((row) => ({
                  id: row.id,
                  kind: "tool" as const,
                  name: row.name,
                  detail: row.detail,
                  result: row.result,
                  status: row.status,
                })),
                ...prev.items.filter((item) => item.kind === "thinking"),
              ],
              toolCount: next.rows.length,
            }));
            if (!streamingTextRef.current) {
              setWorking(true);
            }
          } else if (lower.includes("think")) {
            setProcess((prev) =>
              mergeProcessItem(prev, {
                id: `thinking:${prev.thinkingCount + 1}`,
                kind: "thinking",
                name: "thinking",
                detail: asString(frame.text) || asString(frame.content),
                status: "done",
              }),
            );
            if (!streamingTextRef.current) {
              setWorking(true);
            }
          } else if (!streamingTextRef.current) {
            setWorking(true);
          }
          break;
        }
      }
    },
    [appendStreamChunk, finalizeAssistantTurn],
  );

  const ensureWs = useCallback(
    async (subscribe: boolean): Promise<ChatWsClient | null> => {
      if (wsRef.current) {
        if (subscribe) {
          wsRef.current.subscribe(threadIdRef.current);
        }
        return wsRef.current;
      }

      if (!agentId || !baseUrl) {
        return null;
      }

      const client = await connectDeduperRef.current.run(async () => {
        if (wsRef.current) {
          return wsRef.current;
        }

        const token = await getToken();
        if (!token) {
          return null;
        }

        const url = buildChatWsUrl(baseUrl, agentId, token);
        const created = createChatWsClient({
          url,
          onFrame: handleFrame,
          onOpen: () => setDisconnected(false),
          onDisconnected: () => setDisconnected(true),
          isForeground: () => foregroundRef.current,
          getThreadId: () => threadIdRef.current,
        });

        wsRef.current = created;
        return created;
      });

      if (client && subscribe) {
        client.subscribe(threadIdRef.current);
      }

      return client;
    },
    [agentId, baseUrl, handleFrame],
  );

  const loadHistory = useCallback(async () => {
    if (!agentId) {
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(true);
    setError(null);

    try {
      let history = await getThreadHistory(api, agentId, threadId);

      for (let attempt = 0; history.history_loading && attempt < HISTORY_RETRY_CAP; attempt++) {
        await sleep(history.history_retry_after_ms || DEFAULT_HISTORY_RETRY_MS);
        history = await getThreadHistory(api, agentId, threadId);
      }

      setMessages(historyToDisplayMessages(history.messages));

      if (history.turn_active) {
        setTurnActive(true);
        turnActiveRef.current = true;
        await ensureWs(true);
      }
    } catch {
      setError(t("errors.network"));
    } finally {
      setHistoryLoading(false);
    }
  }, [agentId, api, ensureWs, threadId]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
      void ensureWs(false);

      return () => {
        wsRef.current?.close();
        wsRef.current = null;
        connectDeduperRef.current.reset();
      };
    }, [ensureWs, loadHistory]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      foregroundRef.current = nextState === "active";
      if (nextState === "active") {
        // Wake from sleep: the socket usually died while backgrounded — the
        // client's backoff holds in background, so kick it now (silent).
        const client = wsRef.current;
        if (client && !client.isOpen()) {
          client.reconnect();
        } else if (!client) {
          void ensureWs(true);
        }
      }
    });

    return () => subscription.remove();
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !agentId) {
        return;
      }

      setError(null);
      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      setStreamingText("");
      streamingTextRef.current = "";
      setWorking(false);
      setTurnActive(true);
      turnActiveRef.current = true;
      setProcess(EMPTY_PROCESS);
      toolFrameRef.current = EMPTY_TOOL_FRAME_STATE;

      const client = await ensureWs(false);
      client?.send({ type: "user_turn", text: trimmed, thread_id: threadId });
    },
    [agentId, ensureWs, threadId],
  );

  const stop = useCallback(() => {
    wsRef.current?.send({ type: "cancel", thread_id: threadId });
  }, [threadId]);

  const reconnect = useCallback(async () => {
    setDisconnected(false);
    setError(null);

    if (wsRef.current) {
      wsRef.current.reconnect();
      if (turnActiveRef.current) {
        wsRef.current.subscribe(threadId);
      }
      return;
    }

    await ensureWs(turnActiveRef.current);
  }, [ensureWs, threadId]);

  return {
    messages,
    streamingText,
    working,
    turnActive,
    disconnected,
    send,
    stop,
    reconnect,
    error,
    historyLoading,
    process,
  };
}
