import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { TranscriptEntry } from "@/types";

interface TranscriptState {
  entries: TranscriptEntry[];
  partial: string;
  status: "idle" | "listening" | "processing" | "speaking";
}

const initialState: TranscriptState = { entries: [], partial: "", status: "idle" };

const slice = createSlice({
  name: "transcript",
  initialState,
  reducers: {
    appendEntry(state, action: PayloadAction<TranscriptEntry>) {
      state.entries.push(action.payload);
      state.partial = "";
    },
    setEntries(state, action: PayloadAction<TranscriptEntry[]>) {
      state.entries = action.payload;
    },
    setPartial(state, action: PayloadAction<string>) {
      state.partial = action.payload;
    },
    setStatus(state, action: PayloadAction<TranscriptState["status"]>) {
      state.status = action.payload;
    },
    clearTranscript(state) {
      state.entries = [];
      state.partial = "";
    },
  },
});

export const { appendEntry, setEntries, setPartial, setStatus, clearTranscript } = slice.actions;
export default slice.reducer;
