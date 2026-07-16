import { useAppSelector } from "@/redux/hooks";

export default function StatusBar() {
  const socketStatus = useAppSelector((s) => s.ui.socketStatus);
  const online = useAppSelector((s) => s.ui.online);
  const sessionId = useAppSelector((s) => s.session.sessionId);

  const dot = (color: string) => (
    <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
  );

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {dot(online ? "bg-green-500" : "bg-red-500")}
          <span>Network: {online ? "online" : "offline"}</span>
        </div>
        <div className="flex items-center gap-2">
          {dot(
            socketStatus === "connected"
              ? "bg-green-500"
              : socketStatus === "connecting"
                ? "bg-yellow-500"
                : "bg-red-500",
          )}
          <span>Socket: {socketStatus}</span>
        </div>
        <div className="ml-auto font-mono text-[11px]">
          Session: {sessionId ? sessionId.slice(0, 12) + "…" : "—"}
        </div>
      </div>
    </footer>
  );
}
