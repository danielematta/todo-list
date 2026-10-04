import { useDispatch, useSelector } from "react-redux";
import { type AppDispatch, type RootState } from "./store";

export const useReduxDispatch = useDispatch.withTypes<AppDispatch>();

export const useReduxSelector = useSelector.withTypes<RootState>();