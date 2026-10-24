import type { Workspace } from '@roadly/shared'
import { Code, SquareKanban, type LucideIcon } from 'lucide-react'
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
import { RoadlyMark } from './RoadlyLogo'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'
import { WorkspaceSwitcher } from '@/features/workspaces/components/WorkspaceSwitcher'

export function AppSidebar({ workspace }: { workspace: Workspace }) {
  return (
    <Sidebar variant="inset">
      <SidebarHeader className="flex-row items-center">
        <RoadlyMark className="ml-1 size-7" />
        <WorkspaceSwitcher workspace={workspace} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <nav aria-label="Workspace">
            <SidebarMenu>
              <NavItem to={`/${workspace.slug}/roadmap`} icon={SquareKanban} label="Roadmap" />
              <NavItem to={`/${workspace.slug}/install`} icon={Code} label="Install" />
            </SidebarMenu>
          </nav>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <ThemeToggle />
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
