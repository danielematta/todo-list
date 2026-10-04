import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { type RootState } from "../store/store";

type ThemeTypes = "system" | "light" | "dark";

const initialState = "system" as ThemeTypes;

export const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (_state, action: PayloadAction<ThemeTypes>) => {
      return action.payload;
    },
  },
});

export const { setTheme } = themeSlice.actions;

export const themeSelector = (state: RootState) => state.theme;

export default themeSlice.reducer;
