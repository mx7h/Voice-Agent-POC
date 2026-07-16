import { api } from "./axios";
import type { Order } from "@/types";

const unwrap = <T,>(d: any): T => d?.data ?? d;

export const orderApi = {
  place: async (sessionId: string): Promise<Order> => {
    const { data } = await api.post(`/orders/${sessionId}`);
    return unwrap<Order>(data);
  },
  list: async (): Promise<Order[]> => {
    const { data } = await api.get(`/orders`);
    return unwrap<Order[]>(data);
  },
  get: async (id: string): Promise<Order> => {
    const { data } = await api.get(`/orders/${id}`);
    return unwrap<Order>(data);
  },
  updateStatus: async (id: string, orderStatus: Order["orderStatus"]) => {
    const { data } = await api.patch(`/orders/${id}/status`, { orderStatus });
    return unwrap<Order>(data);
  },
};
