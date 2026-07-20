import { useEffect, useRef } from "react";

import { useAppSelector } from "@/redux/hooks";
import VoiceRecorder from "./VoiceRecorder";
import { formatTime } from "@/utils/format";
import EmptyState from "../common/EmptyState";

function getRoleLabel(role: string) {
  if (role === "user") return "You";
  return "Agent";
}

export default function TranscriptPanel() {
  const { entries, partial, status } = useAppSelector(
    (state) => state.transcript,
  );

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = scrollRef.current;

    if (!element) return;

    element.scrollTo({
      top: element.scrollHeight,
      behavior: "smooth",
    });
  }, [entries.length, partial]);

  return (
    <div className="flex h-full min-h-[560px] flex-col rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h3 className="font-semibold">Voice Assistant</h3>

          <p className="text-xs text-muted-foreground">
            Live conversation transcript
          </p>
        </div>

        <span className="rounded-full bg-muted px-2.5 py-1 text-xs capitalize text-muted-foreground">
          {status}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4"
      >
        {entries.length === 0 && !partial ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              title="No conversation yet"
              description="Tap the mic to start talking."
            />
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, index) => {
              const isUser = entry.role === "user";

              return (
                <div
                  key={`${entry.timestamp}-${index}`}
                  className={`flex ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex max-w-[85%] flex-col ${
                      isUser ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                        isUser
                          ? "rounded-br-sm bg-primary text-primary-foreground"
                          : "rounded-bl-sm bg-muted text-foreground"
                      }`}
                    >
                      {entry.text}
                    </div>

                    <span className="mt-1 text-[10px] text-muted-foreground">
                      {getRoleLabel(entry.role)} ·{" "}
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}

            {partial && (
              <div className="flex justify-end">
                <div className="flex max-w-[85%] flex-col items-end">
                  <div className="rounded-2xl rounded-br-sm bg-primary/60 px-4 py-2 text-sm italic text-primary-foreground">
                    {partial}
                  </div>

                  <span className="mt-1 text-[10px] text-muted-foreground">
                    You · listening...
                  </span>
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