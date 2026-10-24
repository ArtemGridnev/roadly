import { ChevronsUpDown, LogOut } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { useGetMeQuery, useLogoutMutation } from '@/features/auth/api/auth-api'

export function UserMenu() {
  const { data: agent } = useGetMeQuery()
  const [logout] = useLogoutMutation()
  const { isMobile } = useSidebar()

  if (!agent) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg">
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate font-medium">{agent.name}</span>
                <span className="truncate text-xs text-muted-foreground">{agent.email}</span>
              </span>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent side={isMobile ? 'top' : 'right'} align="end" className="w-56">
            <DropdownMenuLabel className="grid font-normal leading-tight">
              <span className="truncate font-medium">{agent.name}</span>
              <span className="truncate text-xs text-muted-foreground">{agent.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => logout()}>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
