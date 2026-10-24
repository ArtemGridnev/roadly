import { Navigate } from 'react-router'
import { LoadError } from '@/components/LoadError'
import { readLastWorkspace } from '../utils/last-workspace'
import { useGetWorkspacesQuery } from '../api/workspaces-api'

export function WorkspaceRedirect() {
  const { data: workspaces, isFetching, refetch } = useGetWorkspacesQuery()

  if (workspaces?.length === 0) {
    return <Navigate to="/onboarding" replace />
  }

  if (workspaces) {
    const lastSlug = readLastWorkspace()
    const target = workspaces.find((workspace) => workspace.slug === lastSlug) ?? workspaces[0]

    return <Navigate to={`/${target.slug}/roadmap`} replace />
  }

  if (isFetching) {
    return null
  }

  return <LoadError onRetry={refetch} />
}
