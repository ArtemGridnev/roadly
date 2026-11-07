import type { Workspace } from '@roadly/shared'
import { Code, SquareKanban, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink, useMatch } from 'react-router'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useInlineSides } from '@/i18n/useInlineSides'
import { RoadlyMark } from './RoadlyLogo'
import { SidebarSettingsMenu } from './SettingsMenu'
import { UserMenu } from './UserMenu'
import { WorkspaceSwitcher } from '@/features/workspaces/components/WorkspaceSwitcher'

export function AppSidebar({ workspace }: { workspace: Workspace }) {
  const { t } = useTranslation()
  const { start } = useInlineSides()

  return (
    <Sidebar variant="inset" side={start}>
      <SidebarHeader className="flex-row items-center">
        <RoadlyMark className="ms-1 size-7" />
        <WorkspaceSwitcher workspace={workspace} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <nav aria-label={t('nav.workspace')}>
            <SidebarMenu>
              <NavItem to={`/${workspace.slug}/roadmap`} icon={SquareKanban} label={t('nav.roadmap')} />
              <NavItem to={`/${workspace.slug}/install`} icon={Code} label={t('nav.install')} />
            </SidebarMenu>
          </nav>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarSettingsMenu />
        </SidebarMenu>
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  )
}

interface NavItemProps {
  to: string
  icon: LucideIcon
  label: string
}

function NavItem({ to, icon: Icon, label }: NavItemProps) {
  const isActive = useMatch(to) !== null
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <NavLink to={to} onClick={() => setOpenMobile(false)}>
          <Icon />
          <span>{label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
