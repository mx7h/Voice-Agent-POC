import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { menuApi } from "@/api/menu.api";
import type { MenuItem } from "@/types";

interface MenuState {
  items: MenuItem[];
  selectedCategory: string | null;
  query: string;
  loading: boolean;
  error: string | null;
}

const initialState: MenuState = {
  items: [],
  selectedCategory: null,
  query: "",
  loading: false,
  error: null,
};

export const fetchMenu = createAsyncThunk("menu/list", async () => menuApi.list());

const slice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    setCategory(state, action: PayloadAction<string | null>) {
      state.selectedCategory = action.payload;
    },
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchMenu.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(fetchMenu.fulfilled, (s, a) => {
      s.loading = false;
      s.items = a.payload;
    });
    b.addCase(fetchMenu.rejected, (s, a) => {
      s.loading = false;
      s.error = a.error.message ?? "Failed to load menu";
    });
  },
});

export const { setCategory, setQuery } = slice.actions;
export default slice.reducer;
