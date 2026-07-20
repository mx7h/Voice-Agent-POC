import { useAppSelector } from "@/redux/hooks";

export default function StatusBar() {
  const online = useAppSelector((state) => state.ui.online);

  const sessionId = useAppSelector(
    (state) => state.session.sessionId,
  );

  const sessionStatus = useAppSelector(
    (state) => state.session.status,
  );

  const transcriptStatus = useAppSelector(
    (state) => state.transcript.status,
  );

  const cartLoading = useAppSelector(
    (state) => state.cart.loading,
  );

  const cartError = useAppSelector(
    (state) => state.cart.error,
  );

  const dot = (color: string) => (
    <span
      className={`inline-block h-2 w-2 rounded-full ${color}`}
    />
  );

  const voiceColor =
    transcriptStatus === "listening"
      ? "bg-green-500"
      : transcriptStatus === "processing"
        ? "bg-yellow-500"
        : "bg-muted-foreground";

  const cartSyncLabel = sessionId
    ? cartLoading
      ? "syncing"
      : cartError
        ? "error"
        : "polling"
    : "idle";

  const cartColor = sessionId
    ? cartError
      ? "bg-red-500"
      : cartLoading
        ? "bg-yellow-500"
        : "bg-green-500"
    : "bg-muted-foreground";

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {dot(online ? "bg-green-500" : "bg-red-500")}
          <span>
            Network: {online ? "online" : "offline"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {dot(voiceColor)}
          <span className="capitalize">
            Voice: {transcriptStatus}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {dot(cartColor)}
          <span>Cart sync: {cartSyncLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          {dot(
            sessionStatus === "ready"
              ? "bg-green-500"
              : sessionStatus === "creating"
                ? "bg-yellow-500"
                : sessionStatus === "error"
                  ? "bg-red-500"
                  : "bg-muted-foreground",
          )}
          <span className="capitalize">
            Session: {sessionStatus}
          </span>
        </div>

        <div className="ml-auto font-mono text-[11px]">
          ID:{" "}
          {sessionId
            ? `${sessionId.slice(0, 12)}…`
            : "—"}
        </div>
      </div>
    </footer>
  );
}