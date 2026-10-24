import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface WorkspaceState {
  activeWorkspaceId: string | null;
}

const initialState: WorkspaceState = {
  activeWorkspaceId: null,
};

export const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setActiveWorkspace(state, action: PayloadAction<string | null>) {
      state.activeWorkspaceId = action.payload;
    },
  },
});

export const { setActiveWorkspace } = workspaceSlice.actions;
