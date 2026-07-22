import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface SessionState {
  sessionId: string | null;
  status: "idle" | "creating" | "ready" | "error";
  error: string | null;
}

const initialState: SessionState = {
  sessionId: null,
  status: "idle",
  error: null,
};

const slice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setSessionCreating(state) {
      state.status = "creating";
      state.error = null;
    },

    setSessionId(state, action: PayloadAction<string>) {
      state.sessionId = action.payload;
      state.status = "ready";
      state.error = null;
    },

    setSessionError(state, action: PayloadAction<string>) {
      state.status = "error";
      state.error = action.payload;
    },

    clearSession(state) {
      state.sessionId = null;
      state.status = "idle";
      state.error = null;
    },
  },
});

export const {
  setSessionCreating,
  setSessionId,
  setSessionError,
  clearSession,
} = slice.actions;

export default slice.reducer;