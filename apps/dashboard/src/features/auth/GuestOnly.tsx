import { Navigate, Outlet } from 'react-router'
import { useGetMeQuery } from './auth-api'

export function GuestOnly() {
  const { data: agent, isLoading } = useGetMeQuery()

  if (agent) {
    return <Navigate to="/" replace />
  }

  if (isLoading) {
    return null
  }

  return <Outlet />
}
