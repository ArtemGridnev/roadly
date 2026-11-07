import { useState } from 'react'
import type { Workspace } from '@roadly/shared'
import { ChevronsUpDown, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
import { useInlineSides } from '@/i18n/useInlineSides'
import { CreateWorkspaceForm } from './CreateWorkspaceForm'
import { useGetWorkspacesQuery } from '../api/workspaces-api'

export function WorkspaceSwitcher({ workspace }: { workspace: Workspace }) {
  const { t } = useTranslation()
  const { data: workspaces = [] } = useGetWorkspacesQuery()
  const { isMobile, setOpenMobile } = useSidebar()
  const { end } = useInlineSides()
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
              <span dir="auto" className="truncate font-medium">{workspace.name}</span>
              <ChevronsUpDown className="ms-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent side={isMobile ? 'bottom' : end} align="start" className="w-56">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              {t('workspaces.switcherLabel')}
            </DropdownMenuLabel>
            {workspaces.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.id}
                checked={option.id === workspace.id}
                onSelect={() => open(`/${option.slug}/roadmap`)}
              >
                <span dir="auto" className="truncate">{option.name}</span>
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setCreating(true)}>
              <Plus />
              {t('workspaces.new')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t('workspaces.new')}</DialogTitle>
              <DialogDescription>{t('workspaces.newDescription')}</DialogDescription>
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
