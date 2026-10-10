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
    }),

    signup: builder.mutation<Agent, CreateAgentInput>({
      query: (body) => ({ url: '/agents', method: 'POST', body }),
    }),
  }),
});

export const { useLoginMutation, useSignupMutation } = authApi;
