import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { type RootState } from "../store/store";

type TokenTypes = string | null;

const initialState = null as TokenTypes;

export const tokenSlice = createSlice({
    name: "token",
    initialState,
    reducers: {
        setToken: (_state, action: PayloadAction<string>) => {
            return action.payload;
        },

        clearToken: () => {
            return null;
        }
    }
})

export const {setToken, clearToken} = tokenSlice.actions;

export const tokenSelector = (state: RootState) => state.token;

export default tokenSlice.reducer;