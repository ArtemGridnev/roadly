import { ChevronsUpDown, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
import { useInlineSides } from '@/i18n/useInlineSides'

export function UserMenu() {
  const { t } = useTranslation()
  const { data: agent } = useGetMeQuery()
  const [logout] = useLogoutMutation()
  const { isMobile } = useSidebar()
  const { end } = useInlineSides()

  if (!agent) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg">
              <span className="grid flex-1 text-start leading-tight">
                <span dir="auto" className="max-w-full justify-self-start truncate font-medium">{agent.name}</span>
                <span dir="auto" className="max-w-full justify-self-start truncate text-xs text-muted-foreground">{agent.email}</span>
              </span>
              <ChevronsUpDown className="ms-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent side={isMobile ? 'top' : end} align="end" className="w-56">
            <DropdownMenuLabel className="grid font-normal leading-tight">
              <span dir="auto" className="max-w-full justify-self-start truncate font-medium">{agent.name}</span>
              <span dir="auto" className="max-w-full justify-self-start truncate text-xs text-muted-foreground">{agent.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => logout()}>
              <LogOut />
              {t('common.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
