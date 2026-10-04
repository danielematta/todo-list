import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { type AuthUserTypes } from "../types/auth.types";
import { type RootState } from "../store/store";

type UserTypes = {
  user: AuthUserTypes | null;
  isAuthorized: boolean;
};

const initialState: UserTypes = {
  user: null,
  isAuthorized: false,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthUserTypes>) => {
      state.user = action.payload;
    },

    clearUser: (state) => {
      state.user = null;
    },

    setIsAuthorized: (state, action: PayloadAction<boolean>) => {
        state.isAuthorized = action.payload;
    }
  },
});

export const { setUser, clearUser, setIsAuthorized } = userSlice.actions;

export const userSelector = (state: RootState) => state.user

export default userSlice.reducer;
