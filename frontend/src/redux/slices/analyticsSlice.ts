import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { analyticsApi } from "@/api/analytics.api";
import type { Analytics } from "@/types";

interface AnalyticsState {
  current: Analytics | null;
  loading: boolean;
}

const initialState: AnalyticsState = { current: null, loading: false };

export const fetchAnalytics = createAsyncThunk("analytics/get", async (sessionId: string) =>
  analyticsApi.get(sessionId),
);

const slice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    setAnalytics(state, action: PayloadAction<Analytics>) {
      state.current = action.payload;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchAnalytics.pending, (s) => {
      s.loading = true;
    });
    b.addCase(fetchAnalytics.fulfilled, (s, a) => {
      s.loading = false;
      s.current = a.payload;
    });
    b.addCase(fetchAnalytics.rejected, (s) => {
      s.loading = false;
    });
  },
});

export const { setAnalytics } = slice.actions;
export default slice.reducer;
