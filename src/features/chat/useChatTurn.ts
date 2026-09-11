import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { buildChatWsUrl, createChatWsClient, type ChatWsClient } from "../../api/chatWs";
import { getThreadHistory } from "../../api/threads";
import type { HistoryMessage, MessageContentBlock } from "../../api/types";
import { t } from "../../i18n";
import { getToken } from "../../storage/secure";
import { useAuth } from "../auth/AuthContext";

export type ChatDisplayMessage = {
  role: "user" | "assistant";
  content: string;
};

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

  const wsRef = useRef<ChatWsClient | null>(null);
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

  const handleFrame = useCallback(
    (frame: Record<string, unknown>) => {
      const type = typeof frame.type === "string" ? frame.type : "";

      switch (type) {
        case "token": {
          const chunk = typeof frame.content === "string" ? frame.content : "";
          setStreamingText((prev) => {
            const next = prev + chunk;
            streamingTextRef.current = next;
            return next;
          });
          setWorking(false);
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
          }
          break;
        case "pong":
          break;
        default:
          setWorking(true);
          break;
      }
    },
    [finalizeAssistantTurn],
  );

  const ensureWs = useCallback(
    async (subscribe: boolean): Promise<ChatWsClient | null> => {
      if (!agentId || !baseUrl) {
        return null;
      }

      const token = await getToken();
      if (!token) {
        return null;
      }

      if (wsRef.current) {
        if (subscribe) {
          wsRef.current.subscribe(threadIdRef.current);
        }
        return wsRef.current;
      }

      const url = buildChatWsUrl(baseUrl, agentId, token);
      const client = createChatWsClient({
        url,
        onFrame: handleFrame,
        onOpen: () => setDisconnected(false),
        onDisconnected: () => setDisconnected(true),
        isForeground: () => foregroundRef.current,
        getThreadId: () => threadIdRef.current,
      });

      if (subscribe) {
        client.subscribe(threadIdRef.current);
      }

      wsRef.current = client;
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
      };
    }, [ensureWs, loadHistory]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      foregroundRef.current = nextState === "active";
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
  };
}
