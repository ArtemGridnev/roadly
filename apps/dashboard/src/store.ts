import {
  configureStore,
  createListenerMiddleware,
} from '@reduxjs/toolkit';
import { api } from './api/api';
import { sessionExpired } from './api/session-expired';
import { authApi } from './features/auth/auth-api';
import {
  setActiveWorkspace,
  workspaceSlice,
} from './features/workspaces/workspace-slice';
import { workspacesApi } from './features/workspaces/workspaces-api';

export function makeStore() {
  const listenerMiddleware = createListenerMiddleware();

  // Cache keys don't include the workspace (it travels in a header), so a switch must drop the cache.
  listenerMiddleware.startListening({
    actionCreator: setActiveWorkspace,
    effect: (action, { dispatch, getOriginalState }) => {
      const state = getOriginalState() as RootState;
      const previous = state.workspace.activeWorkspaceId;

      if (!previous || previous === action.payload) {
        return;
      }

      const agent = authApi.endpoints.getMe.select()(state).data;
      const workspaces =
        workspacesApi.endpoints.getWorkspaces.select()(state).data;

      dispatch(api.util.resetApiState());
      if (agent) {
        dispatch(
          authApi.util.upsertQueryEntries([
            { endpointName: 'getMe', arg: undefined, value: agent },
          ]),
        );
      }
      if (workspaces) {
        dispatch(
          workspacesApi.util.upsertQueryEntries([
            { endpointName: 'getWorkspaces', arg: undefined, value: workspaces },
          ]),
        );
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
