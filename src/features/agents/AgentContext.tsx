import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { listAgents } from "../../api/agents";
import type { ApiError } from "../../api/http";
import type { Agent } from "../../api/types";
import { t } from "../../i18n";
import {
  clearSelectedAgentId,
  getSelectedAgentId,
  setSelectedAgentId as persistSelectedAgentId,
} from "../../storage/preferences";
import { useAuth } from "../auth/AuthContext";

type AgentContextValue = {
  agents: Agent[];
  selectedAgentId: string | null;
  loading: boolean;
  error: string | null;
  selectAgent: (agentId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const AgentContext = createContext<AgentContextValue | null>(null);

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as ApiError).code === "string"
  );
}

function mapAgentError(error: unknown): string {
  if (isApiError(error) && error.code === "NETWORK") {
    return t("errors.network");
  }
  return t("errors.network");
}

export function AgentProvider({ children }: { children: ReactNode }) {
  const { status, api } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSelectedAgentId().then(setSelectedAgentIdState);
  }, []);

  const refresh = useCallback(async () => {
    if (status !== "authenticated") {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const list = await listAgents(api);
      setAgents(list);

      const stored = await getSelectedAgentId();
      if (stored && !list.some((agent) => agent.agent_id === stored)) {
        await clearSelectedAgentId();
        setSelectedAgentIdState(null);
      }
    } catch (err) {
      setError(mapAgentError(err));
    } finally {
      setLoading(false);
    }
  }, [status, api]);

  useEffect(() => {
    if (status === "authenticated") {
      refresh();
    } else {
      setAgents([]);
      setError(null);
    }
  }, [status, refresh]);

  const selectAgent = useCallback(async (agentId: string) => {
    await persistSelectedAgentId(agentId);
    setSelectedAgentIdState(agentId);
  }, []);

  const value = useMemo(
    () => ({ agents, selectedAgentId, loading, error, selectAgent, refresh }),
    [agents, selectedAgentId, loading, error, selectAgent, refresh],
  );

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}

export function useSelectedAgent(): AgentContextValue {
  const ctx = useContext(AgentContext);
  if (!ctx) {
    throw new Error("useSelectedAgent must be used within AgentProvider");
  }
  return ctx;
}
