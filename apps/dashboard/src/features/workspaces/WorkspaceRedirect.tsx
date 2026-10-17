import { Navigate } from 'react-router'
import { LoadError } from '@/components/LoadError'
import { useGetWorkspacesQuery } from './workspaces-api'

export function WorkspaceRedirect() {
  const { data: workspaces, isFetching, refetch } = useGetWorkspacesQuery()

  if (workspaces?.length === 0) {
    return <Navigate to="/onboarding" replace />
  }

  if (workspaces) {
    return (
      <p className="text-sm text-muted-foreground">The Roadmap Board isn't built yet.</p>
    )
  }

  if (isFetching) {
    return null
  }

  return <LoadError onRetry={refetch} />
}
