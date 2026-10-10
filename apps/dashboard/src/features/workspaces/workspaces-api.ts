import type { CreateWorkspaceInput, Workspace } from '@roadly/shared';
import { api } from '../../api/api';

const workspacesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getWorkspaces: builder.query<Workspace[], void>({
      query: () => '/workspaces',
      providesTags: ['Workspace'],
    }),

    createWorkspace: builder.mutation<Workspace, CreateWorkspaceInput>({
      query: (body) => ({ url: '/workspaces', method: 'POST', body }),
      invalidatesTags: (result) => (result ? ['Workspace'] : []),
    }),
  }),
});

export const { useGetWorkspacesQuery, useCreateWorkspaceMutation } =
  workspacesApi;
