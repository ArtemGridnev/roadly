import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import { sessionExpired } from './session-expired';

const baseUrl = import.meta.env.VITE_API_URL;

if (!baseUrl) {
  throw new Error(
    'VITE_API_URL is not set. Add it to apps/dashboard/.env (see .env.example).',
  );
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const { activeWorkspaceId } = (getState() as RootState).workspace;

    if (activeWorkspaceId) {
      headers.set('x-workspace-id', activeWorkspaceId);
    }

    return headers;
  },
});

const NO_REFRESH_URLS = ['/auth/login', '/auth/refresh'];
const SESSION_URL = '/auth/me';

// Shared so concurrent 401s trigger one refresh: the API rotates the refresh token on each use.
let refreshInFlight: ReturnType<typeof rawBaseQuery> | null = null;

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  const url = typeof args === 'string' ? args : args.url;

  if (result.error?.status !== 401 || NO_REFRESH_URLS.includes(url)) {
    return result;
  }

  refreshInFlight ??= Promise.resolve(
    rawBaseQuery({ url: '/auth/refresh', method: 'POST' }, api, extraOptions),
  ).finally(() => {
    refreshInFlight = null;
  });

  const refreshResult = await refreshInFlight;

  if (refreshResult.error) {
    // The session check's own 401 already reaches the guards; resetting on it would refetch it forever.
    if (url !== SESSION_URL) {
      api.dispatch(sessionExpired());
    }

    return result;
  }

  return rawBaseQuery(args, api, extraOptions);
};
