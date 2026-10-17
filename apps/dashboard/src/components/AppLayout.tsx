import { Outlet, useMatches } from 'react-router'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useCurrentWorkspace } from '@/features/workspaces/current-workspace'
import { AppSidebar } from './AppSidebar'

export interface PageHandle {
  title: string
}

export function AppLayout() {
  const workspace = useCurrentWorkspace()
  const title = useMatches()
    .map((match) => (match.handle as PageHandle | undefined)?.title)
    .findLast(Boolean)

  return (
    <SidebarProvider>
      <AppSidebar workspace={workspace} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:px-6">
          <SidebarTrigger aria-label="Open menu" className="-ml-1 md:hidden" />
          <h1 className="text-xl font-semibold">{title}</h1>
        </header>
        <div className="flex-1 p-4 md:p-6">
          <Outlet context={workspace} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
