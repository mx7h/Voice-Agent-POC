import AnalyticsPanel from "@/components/analytics/AnalyticsPanel";

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <h1 className="text-2xl font-semibold">Session Analytics</h1>
      <AnalyticsPanel />
    </div>
  );
}
