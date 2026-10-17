import type {
  Agent,
  AgentLoginInput,
  AgentLoginResponse,
  CreateAgentInput,
} from '@roadly/shared';
import { api } from '../../api/api';

const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AgentLoginResponse, AgentLoginInput>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      invalidatesTags: (result) =>
        result ? ['Workspace', 'FeatureRequest'] : [],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const result = await queryFulfilled.catch(() => null);

        if (result) {
          dispatch(
            authApi.util.upsertQueryData('getMe', undefined, result.data.agent),
          );
        }
      },
    }),

    signup: builder.mutation<AgentLoginResponse, CreateAgentInput>({
      query: (body) => ({ url: '/auth/signup', method: 'POST', body }),
      invalidatesTags: (result) =>
        result ? ['Workspace', 'FeatureRequest'] : [],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const result = await queryFulfilled.catch(() => null);

        if (result) {
          dispatch(
            authApi.util.upsertQueryData('getMe', undefined, result.data.agent),
          );
        }
      },
    }),

    getMe: builder.query<Agent, void>({
      query: () => '/auth/me',
      providesTags: ['Agent'],
    }),

    logout: builder.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled.catch(() => undefined);
        dispatch(api.util.resetApiState());
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useGetMeQuery,
  useLogoutMutation,
} = authApi;
