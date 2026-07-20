import { api } from "./axios";

const unwrap = <T,>(data: any): T => data?.data ?? data;

export type AnalyticsSummary = {
  totalCalls: number;
  activeCalls?: number;
  completedCalls: number;
  failedCalls: number;
  ordersPlaced: number;

  totalTurns: number;
  totalToolCalls: number;
  totalCartUpdates: number;

  totalPromptTokens?: number;
  totalCompletionTokens?: number;
  totalTokens?: number;
  totalCachedPromptTokens?: number;

  averageTurns: number;
  averageDurationSeconds?: number;

  averageLatency?: number;
  averageFirstResponseLatency?: number;

  averageLlmDurationMs?: number;
  averageLlmTtftMs?: number;
};

export type AnalyticsSession = {
  _id: string;
  sessionId: string;

  orderId?: string | { _id: string; total?: number; orderStatus?: string } | null;

  status?: "active" | "completed" | "failed";

  callStartedAt?: string;
  callEndedAt?: string | null;
  durationSeconds?: number;
  totalDuration?: number;

  totalTurns?: number;
  userTurns?: number;
  assistantTurns?: number;

  totalTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  cachedPromptTokens?: number;

  llmDurationMs?: number;
  llmTtftMs?: number;
  llmAverageDurationMs?: number;

  totalLatency?: number;
  averageLatency?: number;
  firstResponseLatency?: number;

  toolCalls?: number;
  cartUpdates?: number;
  orderPlaced?: boolean;

  toolEvents?: {
    toolName?: string;
    latencyMs?: number;
    success?: boolean;
    createdAt?: string;
  }[];



  errors?: {
    message?: string;
    createdAt?: string;
  }[];

  createdAt?: string;
  updatedAt?: string;
};

export const analyticsApi = {
  getSummary: async (): Promise<AnalyticsSummary> => {
    const { data } = await api.get("/analytics/summary");
    return unwrap<AnalyticsSummary>(data);
  },

  getSessions: async (): Promise<AnalyticsSession[]> => {
    const { data } = await api.get("/analytics/sessions");
    return unwrap<AnalyticsSession[]>(data);
  },

  getSession: async (sessionId: string): Promise<AnalyticsSession> => {
    const { data } = await api.get(`/analytics/${sessionId}`);
    return unwrap<AnalyticsSession>(data);
  },

  start: async (sessionId: string) => {
    const { data } = await api.post(`/analytics/${sessionId}/start`);
    return unwrap(data);
  },

  recordTurn: async (
    sessionId: string,
    role: "user" | "assistant",
  ) => {
    const { data } = await api.post(`/analytics/${sessionId}/turn`, {
      role,
    });

    return unwrap(data);
  },

  end: async (
    sessionId: string,
    status: "completed" | "failed" = "completed",
  ) => {
    const { data } = await api.post(`/analytics/${sessionId}/end`, {
      status,
    });

    return unwrap(data);
  },
};