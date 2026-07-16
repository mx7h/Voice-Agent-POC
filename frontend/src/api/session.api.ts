import { api } from "./axios";

export const sessionApi = {
  create: async (): Promise<{ sessionId: string }> => {
    const { data } = await api.post("/sessions");
    return data?.data ?? data;
  },
  get: async (sessionId: string) => {
    const { data } = await api.get(`/sessions/${sessionId}`);
    return data?.data ?? data;
  },
  remove: async (sessionId: string) => {
    const { data } = await api.delete(`/sessions/${sessionId}`);
    return data?.data ?? data;
  },
};
