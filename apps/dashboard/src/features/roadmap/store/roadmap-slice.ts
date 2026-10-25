import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RequestStatus, WidgetFeatureRequestSort } from '@roadly/shared';
import { REQUEST_STATUSES } from '../../feature-requests/constants/request-status';

export type RoadmapView = 'kanban' | 'table';

interface RoadmapState {
  sort: WidgetFeatureRequestSort;
  view: RoadmapView;
  statusFilter: RequestStatus[];
}

const initialState: RoadmapState = {
  sort: 'top',
  view: 'kanban',
  statusFilter: [...REQUEST_STATUSES],
};

export const roadmapSlice = createSlice({
  name: 'roadmap',
  initialState,
  reducers: {
    setSort(state, action: PayloadAction<WidgetFeatureRequestSort>) {
      state.sort = action.payload;
    },
    setView(state, action: PayloadAction<RoadmapView>) {
      state.view = action.payload;
    },
    setStatusFilter(state, action: PayloadAction<RequestStatus[]>) {
      state.statusFilter = REQUEST_STATUSES.filter((status) => action.payload.includes(status));
    },
  },
});

export const { setSort, setView, setStatusFilter } = roadmapSlice.actions;
