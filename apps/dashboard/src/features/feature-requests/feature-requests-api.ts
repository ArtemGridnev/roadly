import type {
  FeatureRequest,
  FindFeatureRequestsQuery,
  UpdateFeatureRequestInput,
  WidgetFeatureRequestSort,
} from '@roadly/shared';
import { api } from '../../api/api';

// TODO: drop the local `sort` once the shared admin query schema carries it.
export interface FeatureRequestListArgs extends FindFeatureRequestsQuery {
  sort?: WidgetFeatureRequestSort;
}

export interface UpdateFeatureRequestArgs {
  id: string;
  changes: UpdateFeatureRequestInput;
}

function applyUpdateToList(
  list: FeatureRequest[],
  updated: FeatureRequest,
  { status, sort }: FeatureRequestListArgs,
) {
  const index = list.findIndex((request) => request.id === updated.id);
  const belongs = !status || updated.status === status;

  if (index !== -1 && belongs) {
    list[index] = updated;
  } else if (index !== -1) {
    list.splice(index, 1);
  } else if (belongs) {
    const insertAt = list.findIndex(
      (request) => compareRequests(updated, request, sort) < 0,
    );
    list.splice(insertAt === -1 ? list.length : insertAt, 0, updated);
  }
}

// Mirrors the API's orderBy so an optimistic insert lands where a refetch would put it.
function compareRequests(
  a: FeatureRequest,
  b: FeatureRequest,
  sort: WidgetFeatureRequestSort = 'newest',
) {
  if (sort === 'top' && a.voteCount !== b.voteCount) {
    return b.voteCount - a.voteCount;
  }

  return b.createdAt.localeCompare(a.createdAt);
}

const featureRequestsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getFeatureRequests: builder.query<FeatureRequest[], FeatureRequestListArgs>(
      {
        query: ({ status, sort }) => ({
          url: '/feature-requests',
          params: { status, sort },
        }),
        providesTags: (result) =>
          result?.map(({ id }) => ({ type: 'FeatureRequest' as const, id })) ??
          [],
      },
    ),

    updateFeatureRequest: builder.mutation<
      FeatureRequest,
      UpdateFeatureRequestArgs
    >({
      query: ({ id, changes }) => ({
        url: `/feature-requests/${id}`,
        method: 'PATCH',
        body: changes,
      }),
      async onQueryStarted(
        { id, changes },
        { dispatch, getState, queryFulfilled },
      ) {
        const cachedArgs = featureRequestsApi.util.selectCachedArgsForQuery(
          getState(),
          'getFeatureRequests',
        );

        const original = cachedArgs
          .flatMap(
            (args) =>
              featureRequestsApi.endpoints.getFeatureRequests.select(args)(
                getState(),
              ).data ?? [],
          )
          .find((request) => request.id === id);

        if (!original) {
          return;
        }

        const updated = { ...original, ...changes };
        const patches = cachedArgs.map((args) =>
          dispatch(
            featureRequestsApi.util.updateQueryData(
              'getFeatureRequests',
              args,
              (list) => applyUpdateToList(list, updated, args),
            ),
          ),
        );

        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
        }
      },
    }),

    deleteFeatureRequest: builder.mutation<void, string>({
      query: (id) => ({ url: `/feature-requests/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, error, id) =>
        error ? [] : [{ type: 'FeatureRequest', id }],
    }),
  }),
});

export const {
  useGetFeatureRequestsQuery,
  useUpdateFeatureRequestMutation,
  useDeleteFeatureRequestMutation,
} = featureRequestsApi;
