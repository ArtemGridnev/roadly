import { useState } from 'react'
import { Navigate, Outlet } from 'react-router'
import { LoadError } from '@/components/LoadError'
import { useGetWorkspacesQuery } from '../api/workspaces-api'

export function RequireNoWorkspace() {
  const { data: workspaces, isFetching, refetch } = useGetWorkspacesQuery()
  const [arrivedWithoutWorkspace, setArrivedWithoutWorkspace] = useState<boolean>()

  if (workspaces && arrivedWithoutWorkspace === undefined) {
    setArrivedWithoutWorkspace(workspaces.length === 0)
  }

  if (arrivedWithoutWorkspace) {
    return <Outlet />
  }

  if (arrivedWithoutWorkspace === false) {
    return <Navigate to="/" replace />
  }

  if (isFetching) {
    return null
  }

  return <LoadError onRetry={refetch} />
}
