import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { sessionApi } from "@/api/session.api";

interface SessionState {
  sessionId: string | null;
  status: "idle" | "creating" | "ready" | "error";
  error: string | null;
}

const initialState: SessionState = { sessionId: null, status: "idle", error: null };

export const createSession = createAsyncThunk("session/create", async () => {
  const r = await sessionApi.create();
  return r.sessionId;
});

const slice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setSessionId(state, action: PayloadAction<string>) {
      state.sessionId = action.payload;
      state.status = "ready";
    },
    clearSession(state) {
      state.sessionId = null;
      state.status = "idle";
    },
  },
  extraReducers: (b) => {
    b.addCase(createSession.pending, (s) => {
      s.status = "creating";
      s.error = null;
    });
    b.addCase(createSession.fulfilled, (s, a) => {
      s.sessionId = a.payload;
      s.status = "ready";
    });
    b.addCase(createSession.rejected, (s, a) => {
      s.status = "error";
      s.error = a.error.message ?? "Failed to create session";
    });
  },
});

export const { setSessionId, clearSession } = slice.actions;
export default slice.reducer;
