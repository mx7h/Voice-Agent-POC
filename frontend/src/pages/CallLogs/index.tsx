import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAppSelector } from "@/redux/hooks";
import { callLogApi } from "@/api/callLog.api";
import type { CallLog } from "@/types";
import Loading from "@/components/common/Loading";
import EmptyState from "@/components/common/EmptyState";
import { formatTime } from "@/utils/format";

export default function CallLogsPage() {
  const sessionId = useAppSelector((s) => s.session.sessionId);
  const [log, setLog] = useState<CallLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  const load = async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const l = await callLogApi.bySession(sessionId);
      setLog(l);
      setSummary(l?.summary ?? "");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const saveSummary = async () => {
    if (!log?._id) return;
    setSaving(true);
    try {
      const updated = await callLogApi.updateSummary(log._id, summary);
      setLog(updated);
      toast.success("Summary saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const markComplete = async () => {
    if (!log?._id) return;
    setCompleting(true);
    try {
      const updated = await callLogApi.complete(log._id);
      setLog(updated);
      toast.success("Call marked complete");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Call Logs</h1>
          <p className="text-xs text-muted-foreground">
            Session: {sessionId ?? "—"}
          </p>
        </div>
        <button
          onClick={load}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
        >
          Refresh
        </button>
      </div>

      {loading && <Loading />}
      {error && !loading && (
        <EmptyState title="Could not load call log" description={error} />
      )}

      {!loading && !error && log && (
        <>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Summary</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  log.completed
                    ? "bg-green-500/15 text-green-600"
                    : "bg-yellow-500/15 text-yellow-600"
                }`}
              >
                {log.completed ? "Completed" : "In progress"}
              </span>
            </div>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={5}
              placeholder="Write a summary of this call…"
              className="w-full resize-y rounded-md border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={saveSummary}
                disabled={saving}
                className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save summary"}
              </button>
              <button
                onClick={markComplete}
                disabled={completing || log.completed}
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
              >
                {log.completed ? "Completed" : completing ? "Marking…" : "Mark complete"}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 font-semibold">Transcript</h2>
            {!log.transcript?.length ? (
              <EmptyState title="No transcript yet" />
            ) : (
              <div className="space-y-2">
                {log.transcript.map((e, i) => (
                  <div
                    key={i}
                    className="flex flex-col rounded-md border border-border p-2"
                  >
                    <span className="text-[10px] uppercase text-muted-foreground">
                      {e.role} · {formatTime(e.timestamp)}
                    </span>
                    <span className="text-sm">{e.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {!loading && !error && !log && (
        <EmptyState title="No call log for this session yet" />
      )}
    </div>
  );
}
