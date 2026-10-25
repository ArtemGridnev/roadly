import { useState } from 'react'
import type { Workspace } from '@roadly/shared'
import { ChevronsUpDown, Plus } from 'lucide-react'
import { useNavigate } from 'react-router'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { CreateWorkspaceForm } from './CreateWorkspaceForm'
import { useGetWorkspacesQuery } from '../api/workspaces-api'

export function WorkspaceSwitcher({ workspace }: { workspace: Workspace }) {
  const { data: workspaces = [] } = useGetWorkspacesQuery()
  const { isMobile, setOpenMobile } = useSidebar()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)

  const open = (path: string) => {
    setOpenMobile(false)
    navigate(path)
  }

  return (
    <SidebarMenu className="flex-1">
      <SidebarMenuItem>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton>
              <span className="truncate font-medium">{workspace.name}</span>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent side={isMobile ? 'bottom' : 'right'} align="start" className="w-56">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Workspaces
            </DropdownMenuLabel>
            {workspaces.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.id}
                checked={option.id === workspace.id}
                onSelect={() => open(`/${option.slug}/roadmap`)}
              >
                <span className="truncate">{option.name}</span>
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setCreating(true)}>
              <Plus />
              New workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>New workspace</DialogTitle>
              <DialogDescription>One per product. Its requests and roadmap live here.</DialogDescription>
            </DialogHeader>
            <CreateWorkspaceForm
              onCreated={(created) => {
                setCreating(false)
                open(`/${created.slug}/install`)
              }}
            />
          </DialogContent>
        </Dialog>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
