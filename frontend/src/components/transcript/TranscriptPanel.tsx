import { useEffect, useRef } from "react";
import { useAppSelector } from "@/redux/hooks";
import VoiceRecorder from "./VoiceRecorder";
import { formatTime } from "@/utils/format";
import EmptyState from "../common/EmptyState";

export default function TranscriptPanel() {
  const { entries, partial, status } = useAppSelector((s) => s.transcript);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [entries.length, partial]);

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-3">
        <div>
          <h3 className="font-semibold">Voice Assistant</h3>
          <p className="text-xs text-muted-foreground capitalize">Status: {status}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3" ref={scrollRef}>
        {entries.length === 0 && !partial ? (
          <EmptyState title="No conversation yet" description="Tap the mic to start talking." />
        ) : (
          <div className="space-y-3">
            {entries.map((e, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  e.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    e.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {e.text}
                </div>
                <span className="mt-1 text-[10px] text-muted-foreground">
                  {e.role} · {formatTime(e.timestamp)}
                </span>
              </div>
            ))}
            {partial && (
              <div className="flex items-end justify-end">
                <div className="max-w-[85%] rounded-lg bg-primary/60 px-3 py-2 text-sm italic text-primary-foreground">
                  {partial}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border p-4">
        <VoiceRecorder />
      </div>
    </div>
  );
}
