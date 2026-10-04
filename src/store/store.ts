import { configureStore } from "@reduxjs/toolkit";
import { rememberReducer, rememberEnhancer } from "redux-remember";
import { themeSlice } from "../reducers/themeSlice.ts";
import { tokenSlice } from "../reducers/tokenSlice.ts";
import { userSlice } from "../reducers/userSlice.ts";

const reducers = {
    theme: themeSlice.reducer,
    token: tokenSlice.reducer,
    user: userSlice.reducer,
}

const remembered = [
    "theme",
    "token",
] satisfies (keyof typeof reducers)[];

const reducer = rememberReducer(reducers);

export const store = configureStore({
  reducer,

  enhancers: (getDefaultEnhancers) =>
    getDefaultEnhancers().concat(
      rememberEnhancer(
        window.localStorage,
        remembered,
      ),
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;