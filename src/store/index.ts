import { configureStore, combineReducers } from "@reduxjs/toolkit";
import userReducer from "./slices/user.slice";
import workspaceReducer from "./slices/workspace.slice";

const rootReducer = combineReducers({
  user: userReducer,
  workspace: workspaceReducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

