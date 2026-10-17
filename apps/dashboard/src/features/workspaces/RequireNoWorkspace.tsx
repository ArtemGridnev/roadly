import { Navigate, Outlet } from 'react-router'
import { LoadError } from '@/components/LoadError'
import { useGetWorkspacesQuery } from './workspaces-api'

export function RequireNoWorkspace() {
  const { data: workspaces, isFetching, refetch } = useGetWorkspacesQuery()

  if (workspaces?.length === 0) {
    return <Outlet />
  }

  if (workspaces) {
    return <Navigate to="/" replace />
  }

  if (isFetching) {
    return null
  }

  return <LoadError onRetry={refetch} />
}
