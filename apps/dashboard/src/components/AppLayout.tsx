import { Outlet } from 'react-router'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useCurrentWorkspace } from '@/features/workspaces/hooks/use-current-workspace'
import { AppSidebar } from './AppSidebar'

export function AppLayout() {
  const workspace = useCurrentWorkspace()

  return (
    <SidebarProvider>
      <AppSidebar workspace={workspace} />
      <SidebarInset>
        <Outlet context={workspace} />
      </SidebarInset>
    </SidebarProvider>
  )
}
