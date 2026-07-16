import { api } from "./axios";
import type { Cart, SelectedModifier } from "@/types";

const unwrap = <T,>(d: any): T => d?.data ?? d;

export const cartApi = {
  get: async (sessionId: string): Promise<Cart> => {
    const { data } = await api.get(`/cart/${sessionId}`);
    return unwrap<Cart>(data);
  },
  addItem: async (
    sessionId: string,
    payload: { menuId: string; quantity: number; selectedModifiers?: SelectedModifier[] },
  ): Promise<Cart> => {
    
    const { data } = await api.post(`/cart/${sessionId}/items`, payload);
    return unwrap<Cart>(data);
  },
  removeItem: async (sessionId: string, cartItemId: string): Promise<Cart> => {
    const { data } = await api.delete(`/cart/${sessionId}/items/${cartItemId}`);
    return unwrap<Cart>(data);
  },
  clear: async (sessionId: string): Promise<Cart> => {
    const { data } = await api.delete(`/cart/${sessionId}`);
    return unwrap<Cart>(data);
  },
};
