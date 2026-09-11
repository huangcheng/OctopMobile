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
