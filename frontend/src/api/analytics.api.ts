import { api } from "./axios";
import type { Analytics } from "@/types";

const unwrap = <T,>(d: any): T => d?.data ?? d;

export const analyticsApi = {
  all: async (): Promise<Analytics[]> => {
    const { data } = await api.get(`/analytics`);
    return unwrap<Analytics[]>(data);
  },
  get: async (sessionId: string): Promise<Analytics> => {
    const { data } = await api.get(`/analytics/${sessionId}`);
    return unwrap<Analytics>(data);
  },
  update: async (sessionId: string, patch: Partial<Analytics>): Promise<Analytics> => {
    const { data } = await api.patch(`/analytics/${sessionId}`, patch);
    return unwrap<Analytics>(data);
  },
};
