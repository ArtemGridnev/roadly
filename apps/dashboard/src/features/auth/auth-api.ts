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
        result ? ['Agent', 'Workspace', 'FeatureRequest'] : [],
    }),

    signup: builder.mutation<AgentLoginResponse, CreateAgentInput>({
      query: (body) => ({ url: '/auth/signup', method: 'POST', body }),
      invalidatesTags: (result) =>
        result ? ['Agent', 'Workspace', 'FeatureRequest'] : [],
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
