import { Outlet } from 'react-router'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useCurrentWorkspace } from '@/features/workspaces/current-workspace'
import { AppSidebar } from './AppSidebar'

export function AppLayout() {
  const workspace = useCurrentWorkspace()

  return (
    <SidebarProvider className="h-svh">
      <AppSidebar workspace={workspace} />
      <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
        <Outlet context={workspace} />
      </SidebarInset>
    </SidebarProvider>
  )
}
