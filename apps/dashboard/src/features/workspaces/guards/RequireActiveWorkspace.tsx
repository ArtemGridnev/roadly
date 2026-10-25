import { useSelector } from 'react-redux'
import { Outlet } from 'react-router'
import type { RootState } from '@/store'
import { useCurrentWorkspace } from '../hooks/use-current-workspace'

export function RequireActiveWorkspace() {
  const workspace = useCurrentWorkspace()
  const activeWorkspaceId = useSelector((state: RootState) => state.workspace.activeWorkspaceId)

  return activeWorkspaceId === workspace.id ? <Outlet context={workspace} /> : null
}
