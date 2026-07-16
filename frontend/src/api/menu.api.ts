import { api } from "./axios";
import type { MenuItem } from "@/types";

const unwrap = <T,>(d: any): T => d?.data ?? d;

export const menuApi = {
  list: async (): Promise<MenuItem[]> => {
    const { data } = await api.get("/menu");
    return unwrap<MenuItem[]>(data);
  },
  get: async (id: string): Promise<MenuItem> => {
    const { data } = await api.get(`/menu/${id}`);
    return unwrap<MenuItem>(data);
  },
  search: async (q: string): Promise<MenuItem[]> => {
    const { data } = await api.get(`/menu/search`, { params: { q } });
    return unwrap<MenuItem[]>(data);
  },
  byCategory: async (category: string): Promise<MenuItem[]> => {
    const { data } = await api.get(`/menu/category/${encodeURIComponent(category)}`);
    return unwrap<MenuItem[]>(data);
  },
  available: async (): Promise<MenuItem[]> => {
    const { data } = await api.get("/menu/available");
    return unwrap<MenuItem[]>(data);
  },
};
