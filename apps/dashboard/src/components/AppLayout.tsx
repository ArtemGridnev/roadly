import { useState } from 'react'
import { Outlet, useMatches } from 'react-router'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useCurrentWorkspace } from '@/features/workspaces/current-workspace'
import { AppSidebar } from './AppSidebar'
import { PageActionsContext } from './page-actions-context'

export interface PageHandle {
  title: string
}

export function AppLayout() {
  const workspace = useCurrentWorkspace()
  const [actions, setActions] = useState<HTMLDivElement | null>(null)
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
          <div ref={setActions} className="ml-auto flex items-center gap-2" />
        </header>
        <div className="min-w-0 flex-1 p-4 md:p-6">
          <PageActionsContext value={actions}>
            <Outlet context={workspace} />
          </PageActionsContext>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
