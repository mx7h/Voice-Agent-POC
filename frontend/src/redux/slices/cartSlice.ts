import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { cartApi } from "@/api/cart.api";
import type { Cart, SelectedModifier } from "@/types";

interface CartState {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
}

const initialState: CartState = { cart: null, loading: false, error: null };

export const fetchCart = createAsyncThunk("cart/get", async (sessionId: string) =>
  cartApi.get(sessionId),
);

export const addToCart = createAsyncThunk(
  "cart/add",
  async (p: {
    sessionId: string;
    menuId: string;
    quantity: number;
    selectedModifiers?: SelectedModifier[];
  }) => cartApi.addItem(p.sessionId, p),
);

export const removeFromCart = createAsyncThunk(
  "cart/remove",
  async (p: { sessionId: string; cartItemId: string }) =>
    cartApi.removeItem(p.sessionId, p.cartItemId),
);

export const clearCart = createAsyncThunk("cart/clear", async (sessionId: string) =>
  cartApi.clear(sessionId),
);

const slice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCart(state, action: PayloadAction<Cart | null>) {
      state.cart = action.payload;
    },
  },
  extraReducers: (b) => {
    const setResult = (s: CartState, a: { payload: Cart }) => {
      s.loading = false;
      s.cart = a.payload;
    };
    [fetchCart, addToCart, removeFromCart, clearCart].forEach((t) => {
      b.addCase(t.pending, (s) => {
        s.loading = true;
        s.error = null;
      });
      b.addCase(t.fulfilled, setResult);
      b.addCase(t.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message ?? "Cart error";
      });
    });
  },
});

export const { setCart } = slice.actions;
export default slice.reducer;
