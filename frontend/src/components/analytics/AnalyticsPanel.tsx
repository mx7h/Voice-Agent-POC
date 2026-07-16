import { useAppSelector } from "@/redux/hooks";
import { formatCurrency } from "@/utils/format";

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

export default function AnalyticsPanel() {
  const analytics = useAppSelector((s) => s.analytics.current);
  if (!analytics)
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        No analytics yet.
      </div>
    );

  const avgLatencySec =
    typeof analytics.averageLatency === "number" ? (analytics.averageLatency / 1000).toFixed(1) : null;
  const durationSec =
    typeof analytics.totalDuration === "number" ? Math.round(analytics.totalDuration / 1000) : null;

  return (
    <div className="grid grid-cols-2 gap-2">
      <Tile label="Total Turns" value={analytics.totalTurns ?? 0} />
      <Tile label="Total Tokens" value={analytics.totalTokens ?? 0} />
      <Tile label="Tool Calls" value={analytics.toolCalls ?? 0} />
      <Tile
        label="Avg Latency"
        value={avgLatencySec !== null ? `${avgLatencySec}s` : "—"}
      />
      <Tile
        label="Total Duration"
        value={durationSec !== null ? `${durationSec}s` : "—"}
      />
      <Tile
        label="Order Placed"
        value={analytics.orderPlaced ? "Yes" : "No"}
      />
    </div>
  );
}

