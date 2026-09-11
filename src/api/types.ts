export type User = {
  id: number;
  username: string;
  role: string;
  display_name: string | null;
  locale: string;
  permissions: string[];
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
};

export type Agent = {
  agent_id: string;
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  icon_name?: string | null;
  icon_url?: string | null;
  color?: string | null;
  state?: string | null;
  unread_count?: number;
  is_owner?: boolean;
  is_shared?: boolean;
  owner_username?: string | null;
  bootstrap_pending?: boolean;
};

export type ThreadSummary = {
  thread_id: string;
  title: string;
  session_key: string;
  last_active: string;
  created_at: string;
  is_active: boolean;
  has_messages: boolean;
  pinned: boolean;
  model_ref: string | null;
  reasoning_mode: string | null;
  reasoning_effort: string | null;
  artifacts: unknown[];
};

export type MessageContentBlock = {
  type?: string;
  text?: string;
  [key: string]: unknown;
};

export type HistoryMessage = {
  role: string;
  content: string | MessageContentBlock[];
  [key: string]: unknown;
};

export type HistoryResponse = {
  thread_id: string;
  messages: HistoryMessage[];
  has_more: boolean;
  limit: number;
  offset: number;
  history_loading: boolean;
  history_status: string;
  history_retry_after_ms: number;
  turn_active: boolean;
  hitl_pending: unknown | null;
  artifacts: unknown[];
};

export type CreateThreadResponse = {
  thread_id: string;
  session_key: string;
};

export type ThreadHistoryOptions = {
  limit?: number;
  offset?: number;
};

/** Knowledge base row from GET /api/knowledge-bases (contract §9). */
export type KnowledgeBase = {
  id: string;
  name: string;
  description: string | null;
  shared?: boolean;
  default_open?: boolean;
  icon_name?: string | null;
  owner_user_id?: number;
  owner_username?: string | null;
  owner_display_name?: string | null;
  document_count?: number;
  created_at?: string | null;
  updated_at?: string | null;
};

export type KnowledgeDocument = {
  id: string;
  knowledge_base_id?: string;
  filename?: string | null;
  content_type?: string | null;
  status?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

/** Cron row from GET /api/agents/{agent_id}/cron (contract §9). */
export type CronJob = {
  cron_id: string;
  agent_id: string;
  trigger: string;
  prompt: string;
  enabled: boolean | number;
  task_type?: string;
  session_key?: string | null;
  model?: string | null;
  fresh_thread?: boolean;
  last_run_at?: string | null;
  last_status?: string | null;
  last_error?: string | null;
  next_run_at?: string | null;
  created_at?: string | null;
  agent_name?: string | null;
  [key: string]: unknown;
};

export type CronSettings = {
  timezone: string;
};

/** Proactive care config from GET/PUT /api/agents/{agent_id}/proactive-care (contract §9). */
export type ProactiveCareConfig = {
  enabled: boolean;
  active_hours_start: string;
  active_hours_end: string;
  min_interval_hours: number;
  max_interval_hours: number;
};
