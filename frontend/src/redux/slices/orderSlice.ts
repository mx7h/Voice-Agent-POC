import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { orderApi } from "@/api/order.api";
import type { Order } from "@/types";

interface OrderState {
  current: Order | null;
  list: Order[];
  loading: boolean;
  error: string | null;
}

const initialState: OrderState = { current: null, list: [], loading: false, error: null };

export const placeOrder = createAsyncThunk("order/place", async (sessionId: string) =>
  orderApi.place(sessionId),
);
export const fetchOrders = createAsyncThunk("order/list", async () => orderApi.list());
export const fetchOrder = createAsyncThunk("order/get", async (id: string) => orderApi.get(id));

const slice = createSlice({
  name: "order",
  initialState,
  reducers: {
    setCurrent(state, action: PayloadAction<Order>) {
      state.current = action.payload;
      if (!state.list.find((o) => o._id === action.payload._id)) {
        state.list.unshift(action.payload);
      }
    },
  },
  extraReducers: (b) => {
    b.addCase(placeOrder.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(placeOrder.fulfilled, (s, a) => {
      s.loading = false;
      s.current = a.payload;
      s.list.unshift(a.payload);
    });
    b.addCase(placeOrder.rejected, (s, a) => {
      s.loading = false;
      s.error = a.error.message ?? "Failed to place order";
    });
    b.addCase(fetchOrders.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(fetchOrders.fulfilled, (s, a) => {
      s.loading = false;
      s.list = a.payload;
    });
    b.addCase(fetchOrders.rejected, (s, a) => {
      s.loading = false;
      s.error = a.error.message ?? "Failed to load orders";
    });
    b.addCase(fetchOrder.fulfilled, (s, a) => {
      s.current = a.payload;
      const idx = s.list.findIndex((o) => o._id === a.payload._id);
      if (idx >= 0) s.list[idx] = a.payload;
      else s.list.unshift(a.payload);
    });
  },
});

export const { setCurrent } = slice.actions;
export default slice.reducer;
