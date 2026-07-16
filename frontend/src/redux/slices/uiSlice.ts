import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  socketStatus: "disconnected" | "connecting" | "connected";
  online: boolean;
}

const initialState: UiState = {
  socketStatus: "disconnected",
  online: typeof navigator !== "undefined" ? navigator.onLine : true,
};

const slice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSocketStatus(state, action: PayloadAction<UiState["socketStatus"]>) {
      state.socketStatus = action.payload;
    },
    setOnline(state, action: PayloadAction<boolean>) {
      state.online = action.payload;
    },
  },
});

export const { setSocketStatus, setOnline } = slice.actions;
export default slice.reducer;
