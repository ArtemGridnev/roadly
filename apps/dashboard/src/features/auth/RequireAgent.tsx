import { Navigate, Outlet } from 'react-router'
import { getErrorStatus } from '@/api/errors'
import { LoadError } from '@/components/LoadError'
import { useGetMeQuery } from './auth-api'

export function RequireAgent() {
  const { data: agent, error, isFetching, refetch } = useGetMeQuery()

  if (agent) {
    return <Outlet />
  }

  if (isFetching) {
    return null
  }

  if (getErrorStatus(error) === 401) {
    return <Navigate to="/login" replace />
  }

  return <LoadError onRetry={refetch} />
}
