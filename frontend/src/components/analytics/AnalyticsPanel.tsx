import { useEffect, useState } from "react";
import type { ElementType } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  RefreshCcw,
  ShoppingCart,
  Timer,
  Wrench,
  Zap,
  Cpu,
} from "lucide-react";

import { analyticsApi, type AnalyticsSession, type AnalyticsSummary } from "@/api/analytics.api";

function formatNumber(value?: number) {
  return Number(value ?? 0).toLocaleString();
}

function formatDuration(seconds?: number) {
  const total = Number(seconds ?? 0);

  if (total <= 0) return "0s";

  const mins = Math.floor(total / 60);
  const secs = Math.round(total % 60);

  if (mins <= 0) return `${secs}s`;

  return `${mins}m ${secs}s`;
}

function formatMs(value?: number) {
  const ms = Math.round(Number(value ?? 0));

  if (ms <= 0) return "0ms";

  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }

  return `${ms}ms`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusClass(status?: string) {
  if (status === "completed") {
    return "bg-emerald-500/15 text-emerald-600";
  }

  if (status === "failed") {
    return "bg-red-500/15 text-red-600";
  }

  return "bg-yellow-500/15 text-yellow-600";
}

function StatCard({
  label,
  value,
  icon: Icon,
  helper,
}: {
  label: string;
  value: string | number;
  icon: ElementType;
  helper?: string;
}) {
  return (
    <div className="min-h-[112px] rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-5 text-muted-foreground">{label}</p>

        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      </div>

      <p className="mt-4 text-2xl font-semibold tracking-tight">{value}</p>

      {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function SessionCard({ session }: { session: AnalyticsSession }) {
  const duration = session.durationSeconds ?? session.totalDuration ?? 0;

  const latestTools = session.toolEvents?.slice(-3) ?? [];

  const metrics = [
    ["Turns", formatNumber(session.totalTurns)],
    ["Tools", formatNumber(session.toolCalls)],
    ["Cart updates", formatNumber(session.cartUpdates)],
    ["Duration", formatDuration(duration)],

    ["User turns", formatNumber(session.userTurns)],
    ["Agent turns", formatNumber(session.assistantTurns)],
    ["Tool avg latency", formatMs(session.averageLatency)],
    ["Order placed", session.orderPlaced ? "Yes" : "No"],

    ["Total tokens", formatNumber(session.totalTokens)],
    ["Prompt tokens", formatNumber(session.promptTokens)],
    ["Completion tokens", formatNumber(session.completionTokens)],
    ["Cached tokens", formatNumber(session.cachedPromptTokens)],

    ["LLM duration", formatMs(session.llmDurationMs)],
    ["LLM TTFT", formatMs(session.llmTtftMs)],
    ["Avg LLM duration", formatMs(session.llmAverageDurationMs)],
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-all font-mono text-xs text-muted-foreground">{session.sessionId}</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Started {formatDate(session.callStartedAt ?? session.createdAt)}
          </p>
        </div>

        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusClass(
            session.status,
          )}`}
        >
          {session.status ?? "active"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-md bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 font-medium">{value}</p>
          </div>
        ))}
      </div>

      {latestTools.length > 0 && (
        <div className="mt-5 border-t border-border pt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Latest tool calls</p>
              <p className="text-xs text-muted-foreground">
                Recent backend actions executed by the agent
              </p>
            </div>

            <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              {latestTools.length} shown
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {latestTools.map((tool, index) => {
              const success = tool.success !== false;

              return (
                <div
                  key={`${tool.toolName}-${index}`}
                  className="rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs font-medium">
                        {tool.toolName ?? "tool"}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Latency {formatMs(tool.latencyMs)}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        success
                          ? "bg-emerald-500/15 text-emerald-600"
                          : "bg-red-500/15 text-red-600"
                      }`}
                    >
                      {success ? "success" : "failed"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {session.errors && session.errors.length > 0 && (
        <div className="mt-4 rounded-md bg-red-500/10 p-3 text-xs text-red-600">
          {session.errors[session.errors.length - 1]?.message ?? "Session error"}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPanel() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [sessions, setSessions] = useState<AnalyticsSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryData, sessionsData] = await Promise.all([
        analyticsApi.getSummary(),
        analyticsApi.getSessions(),
      ]);

      setSummary(summaryData);
      setSessions(sessionsData);
    } catch (err) {
      console.error("[ANALYTICS LOAD ERROR]", err);

      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Loading analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm font-medium">Analytics error</p>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">{error}</p>

        <button
          type="button"
          onClick={() => void loadAnalytics()}
          className="mt-4 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
        >
          Retry
        </button>
      </div>
    );
  }

  const successRate =
    summary && summary.totalCalls > 0
      ? Math.round((summary.ordersPlaced / summary.totalCalls) * 100)
      : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Overview</h2>
          <p className="text-sm text-muted-foreground">
            Voice session, tool-call, cart, order, token, and LLM latency analytics.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadAnalytics()}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        <StatCard label="Total calls" value={formatNumber(summary?.totalCalls)} icon={Activity} />

        <StatCard
          label="Orders placed"
          value={formatNumber(summary?.ordersPlaced)}
          icon={ShoppingCart}
        />

        <StatCard label="Success rate" value={`${successRate}%`} icon={CheckCircle2} />

        <StatCard
          label="Completed calls"
          value={formatNumber(summary?.completedCalls)}
          icon={BarChart3}
        />

        <StatCard label="Total turns" value={formatNumber(summary?.totalTurns)} icon={Clock} />

        <StatCard label="Tool calls" value={formatNumber(summary?.totalToolCalls)} icon={Wrench} />

        <StatCard
          label="Cart updates"
          value={formatNumber(summary?.totalCartUpdates)}
          icon={ShoppingCart}
        />

        <StatCard
          label="Avg call duration"
          value={formatDuration(summary?.averageDurationSeconds)}
          icon={Timer}
        />

        <StatCard label="Total tokens" value={formatNumber(summary?.totalTokens)} icon={Zap} />

        <StatCard
          label="Prompt tokens"
          value={formatNumber(summary?.totalPromptTokens)}
          icon={Cpu}
        />

        <StatCard
          label="Completion tokens"
          value={formatNumber(summary?.totalCompletionTokens)}
          icon={Cpu}
        />

        <StatCard
          label="Cached tokens"
          value={formatNumber(summary?.totalCachedPromptTokens)}
          icon={Cpu}
        />

        <StatCard
          label="Avg tool latency"
          value={formatMs(summary?.averageLatency)}
          icon={Timer}
          helper="Backend tool calls"
        />

        <StatCard
          label="Avg TTFT"
          value={formatMs(summary?.averageLlmTtftMs)}
          icon={Timer}
          helper="LLM first token"
        />

        <StatCard
          label="Avg LLM duration"
          value={formatMs(summary?.averageLlmDurationMs)}
          icon={Timer}
          helper="LLM response time"
        />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="text-lg font-semibold">Recent Sessions</h2>
          <p className="text-sm text-muted-foreground">
            Latest voice ordering sessions from analytics collection.
          </p>
        </div>

        <div className="space-y-3 p-4">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No analytics sessions yet. Start a voice call and place an order to generate
              analytics.
            </p>
          ) : (
            sessions.map((session) => <SessionCard key={session._id} session={session} />)
          )}
        </div>
      </div>
    </div>
  );
}
