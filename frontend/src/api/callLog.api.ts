import { api } from "./axios";
import type { CallLog, TranscriptEntry } from "@/types";

const unwrap = <T,>(d: any): T => d?.data ?? d;

export const callLogApi = {
  bySession: async (sessionId: string): Promise<CallLog> => {
    const { data } = await api.get(`/call-logs/${sessionId}`);
    return unwrap<CallLog>(data);
  },
  updateTranscript: async (id: string, transcript: TranscriptEntry[]) => {
    const { data } = await api.patch(`/call-logs/${id}/transcript`, { transcript });
    return unwrap<CallLog>(data);
  },
  updateSummary: async (id: string, summary: string) => {
    const { data } = await api.patch(`/call-logs/${id}/summary`, { summary });
    return unwrap<CallLog>(data);
  },
  complete: async (id: string) => {
    const { data } = await api.patch(`/call-logs/${id}/complete`);
    return unwrap<CallLog>(data);
  },
};
