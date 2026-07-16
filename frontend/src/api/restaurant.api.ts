import { api } from "./axios";
import type { Restaurant } from "@/types";

export const restaurantApi = {
  list: async (): Promise<Restaurant[]> => {
    const { data } = await api.get("/restaurant");
    const payload = data?.data ?? data;
    return Array.isArray(payload) ? payload : [payload].filter(Boolean);
  },
  get: async (id: string): Promise<Restaurant> => {
    const { data } = await api.get(`/restaurant/${id}`);
    return data?.data ?? data;
  },
  update: async (id: string, patch: Partial<Restaurant>) => {
    const { data } = await api.patch(`/restaurant/${id}`, patch);
    return data?.data ?? data;
  },
  updateStatus: async (id: string, isOpen: boolean) => {
    const { data } = await api.patch(`/restaurant/${id}/status`, { isOpen });
    return data?.data ?? data;
  },
};
