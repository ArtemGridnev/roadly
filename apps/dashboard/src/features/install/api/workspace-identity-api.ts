import type {
  UpdateWorkspaceIdentityInput,
  WorkspaceIdentity,
  WorkspaceIdentitySecret,
} from '@roadly/shared';
import { api } from '../../../api/api';

const workspaceIdentityApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getWorkspaceIdentity: builder.query<WorkspaceIdentity, void>({
      query: () => '/workspace-identity',
      providesTags: ['WorkspaceIdentity'],
    }),

    rotateIdentitySecret: builder.mutation<WorkspaceIdentitySecret, void>({
      query: () => ({ url: '/workspace-identity/secret', method: 'POST' }),
      invalidatesTags: (result) => (result ? ['WorkspaceIdentity'] : []),
    }),

    updateWorkspaceIdentity: builder.mutation<
      WorkspaceIdentity,
      UpdateWorkspaceIdentityInput
    >({
      query: (body) => ({ url: '/workspace-identity', method: 'PATCH', body }),
      invalidatesTags: (result) =>
        result ? ['WorkspaceIdentity', 'Workspace'] : [],
    }),
  }),
});

export const {
  useGetWorkspaceIdentityQuery,
  useRotateIdentitySecretMutation,
  useUpdateWorkspaceIdentityMutation,
} = workspaceIdentityApi;
