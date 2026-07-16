import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { restaurantApi } from "@/api/restaurant.api";
import type { Restaurant } from "@/types";

interface RestaurantState {
  current: Restaurant | null;
  list: Restaurant[];
  loading: boolean;
  error: string | null;
}

const initialState: RestaurantState = { current: null, list: [], loading: false, error: null };

export const fetchRestaurants = createAsyncThunk("restaurant/list", async () => {
  return await restaurantApi.list();
});

const slice = createSlice({
  name: "restaurant",
  initialState,
  reducers: {
    setStatus(state, action: PayloadAction<{ isOpen: boolean }>) {
      if (!state.current) return;
      state.current.isOpen = action.payload.isOpen;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchRestaurants.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(fetchRestaurants.fulfilled, (s, a) => {
      s.loading = false;
      s.list = a.payload;
      s.current = a.payload[0] ?? null;
    });
    b.addCase(fetchRestaurants.rejected, (s, a) => {
      s.loading = false;
      s.error = a.error.message ?? "Failed to load restaurant";
    });
  },
});

export const { setStatus } = slice.actions;
export default slice.reducer;
