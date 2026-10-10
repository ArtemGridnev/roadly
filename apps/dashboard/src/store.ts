import {
  configureStore,
  createListenerMiddleware,
} from '@reduxjs/toolkit';
import { api } from './api/api';
import {
  setActiveWorkspace,
  workspaceSlice,
} from './features/workspaces/workspace-slice';

const listenerMiddleware = createListenerMiddleware();

// Cache keys don't include the workspace (it travels in a header), so a switch must drop the cache.
listenerMiddleware.startListening({
  actionCreator: setActiveWorkspace,
  effect: (action, { dispatch, getOriginalState }) => {
    const previous = (getOriginalState() as RootState).workspace
      .activeWorkspaceId;

    if (previous && previous !== action.payload) {
      dispatch(api.util.resetApiState());
    }
  },
});

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    [workspaceSlice.reducerPath]: workspaceSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
      .concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
