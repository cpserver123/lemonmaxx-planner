import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type DashboardTabId =
  | "dashboard"
  | "planning"
  | "promises"
  | "meetings"
  | "scoreboard";

interface DashboardTabState {
  activeTab: DashboardTabId;
}

const initialState: DashboardTabState = {
  activeTab: "dashboard",
};

export const dashboardTabSlice = createSlice({
  name: "dashboardTab",
  initialState,
  reducers: {
    setActiveTab(state, action: PayloadAction<DashboardTabId>) {
      state.activeTab = action.payload;
    },
  },
});

export const { setActiveTab } = dashboardTabSlice.actions;
export default dashboardTabSlice.reducer;
