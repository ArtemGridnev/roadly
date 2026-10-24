import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { WidgetFeatureRequestSort } from '@roadly/shared';

interface RoadmapState {
  sort: WidgetFeatureRequestSort;
}

const initialState: RoadmapState = {
  sort: 'top',
};

export const roadmapSlice = createSlice({
  name: 'roadmap',
  initialState,
  reducers: {
    setSort(state, action: PayloadAction<WidgetFeatureRequestSort>) {
      state.sort = action.payload;
    },
  },
});

export const { setSort } = roadmapSlice.actions;
