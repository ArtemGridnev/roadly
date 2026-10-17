import {
  configureStore,
  createListenerMiddleware,
} from '@reduxjs/toolkit';
import { api } from './api/api';
import { sessionExpired } from './api/session-expired';
import {
  setActiveWorkspace,
  workspaceSlice,
} from './features/workspaces/workspace-slice';

export function makeStore() {
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

  listenerMiddleware.startListening({
    actionCreator: sessionExpired,
    effect: (_, { dispatch }) => {
      dispatch(api.util.resetApiState());
    },
  });

  return configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
      [workspaceSlice.reducerPath]: workspaceSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .prepend(listenerMiddleware.middleware)
        .concat(api.middleware),
  });
}

export const store = makeStore();

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
