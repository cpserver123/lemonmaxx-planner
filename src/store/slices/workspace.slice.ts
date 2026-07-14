import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Workspace {
  id: number | string;
  name: string;
  is_favorite?: boolean | string | number;
  default_timezone?: string;
  media_buyer_code_wise?: boolean;
  [key: string]: unknown;
}

interface WorkspaceState {
  list: Workspace[];
  selectedId: number | string | null;
}

const initialState: WorkspaceState = {
  list: [],
  selectedId: null,
};

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    setWorkspaceList: (state, action: PayloadAction<Workspace[]>) => {
      state.list = action.payload;
    },
    setSelectedWorkspaceId: (state, action: PayloadAction<number | string | null>) => {
      state.selectedId = action.payload;
    },
    setCreateStoreWorkspace: (state, action: PayloadAction<Workspace>) => {
      state.list.push(action.payload);
    },
  },
});

export const { setWorkspaceList, setSelectedWorkspaceId, setCreateStoreWorkspace } = workspaceSlice.actions;
export default workspaceSlice.reducer;
