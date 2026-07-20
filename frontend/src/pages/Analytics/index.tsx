import AnalyticsPanel from "@/components/analytics/AnalyticsPanel";

export default function AnalyticsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold">Session Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track calls, transcripts, tools, cart updates, and orders.
        </p>
      </div>

      <AnalyticsPanel />
    </div>
  );
}