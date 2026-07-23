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
  User,
  Bot,
  Terminal,
  ChevronDown,
} from "lucide-react";

import { analyticsApi, type AnalyticsSession, type AnalyticsSummary } from "@/api/analytics.api";

type TimelineEvent = {
  _id?: string;
  type: "transcript" | "tool" | "order" | "error";
  role?: "user" | "assistant" | null;
  text?: string;
  toolName?: string;
  toolInput?: unknown;
  toolOutput?: unknown;
  latencyMs?: number;
  success?: boolean;
  createdAt?: string;
};

type AnalyticsSessionWithTimeline = AnalyticsSession & {
  timelineEvents?: TimelineEvent[];
};

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

function formatTime(value?: string | null) {
  if (!value) return "";

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
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

function TimelineRow({ event }: { event: TimelineEvent }) {
  if (event.type === "tool") {
    const success = event.success !== false;

    return (
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
          <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        <div className="min-w-0 flex-1 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs font-medium">{event.toolName || "tool"}</span>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">{formatMs(event.latencyMs)}</span>

              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  success ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/15 text-red-600"
                }`}
              >
                {success ? "success" : "failed"}
              </span>
            </div>
          </div>

          <p className="mt-0.5 text-[11px] text-muted-foreground">{formatTime(event.createdAt)}</p>
        </div>
      </div>
    );
  }

  if (event.type === "order") {
    return (
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        </div>

        <div className="min-w-0 flex-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
          <p className="text-sm font-medium text-emerald-700">
            {event.text || "Order placed successfully."}
          </p>

          {event.toolName ? (
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">{event.toolName}</p>
          ) : null}

          <p className="mt-0.5 text-[11px] text-muted-foreground">{formatTime(event.createdAt)}</p>
        </div>
      </div>
    );
  }

  if (event.type === "error") {
    return (
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/15">
          <AlertCircle className="h-3.5 w-3.5 text-red-600" />
        </div>

        <div className="min-w-0 flex-1 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
          <p className="text-sm font-medium text-red-700">{event.text || "Error occurred."}</p>

          {event.toolName ? (
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">{event.toolName}</p>
          ) : null}

          <p className="mt-0.5 text-[11px] text-muted-foreground">{formatTime(event.createdAt)}</p>
        </div>
      </div>
    );
  }

  const isUser = event.role === "user";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-primary/15" : "bg-muted"
        }`}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>

      <div
        className={`min-w-0 max-w-[85%] rounded-lg px-3 py-2 ${
          isUser ? "bg-primary/10" : "bg-muted/50"
        }`}
      >
        <div className={`flex items-center gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
          <span className="text-[11px] font-medium capitalize text-muted-foreground">
            {event.role ?? "assistant"}
          </span>

          <span className="text-[11px] text-muted-foreground">{formatTime(event.createdAt)}</span>
        </div>

        <p className="mt-1 text-sm leading-snug">{event.text || "—"}</p>
      </div>
    </div>
  );
}

function SessionCard({ session }: { session: AnalyticsSessionWithTimeline }) {
  const [showTimeline, setShowTimeline] = useState(false);
  const duration = session.durationSeconds ?? session.totalDuration ?? 0;

  const timeline = (session.timelineEvents ?? [])
    .slice()
    .sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime());

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

    // ["LLM duration", formatMs(session.llmDurationMs)],
    // ["LLM TTFT", formatMs(session.llmTtftMs)],
    // ["Avg LLM duration", formatMs(session.llmAverageDurationMs)],
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

      {timeline.length > 0 && (
        <div className="mt-5 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setShowTimeline(!showTimeline)}
            className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 hover:bg-muted/50"
          >
            <div className="text-left">
              <p className="text-sm font-medium">Timeline</p>
              <p className="text-xs text-muted-foreground">{timeline.length} events</p>
            </div>

            <ChevronDown
              className={`h-4 w-4 shrink-0 transition-transform ${
                showTimeline ? "rotate-180" : ""
              }`}
            />
          </button>

          {showTimeline && (
            <div className="mt-3 max-h-96 space-y-3 overflow-y-auto rounded-lg border border-dashed border-border bg-muted/20 p-3 pr-1">
              {timeline.map((event, index) => (
                <TimelineRow key={event._id ?? index} event={event} />
              ))}
            </div>
          )}
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
  const [sessions, setSessions] = useState<AnalyticsSessionWithTimeline[]>([]);
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
      setSessions(sessionsData as AnalyticsSessionWithTimeline[]);
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
            Voice session, timeline, tool-call, cart, order, token, and LLM latency analytics.
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

        {/* <StatCard
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
        /> */}
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
