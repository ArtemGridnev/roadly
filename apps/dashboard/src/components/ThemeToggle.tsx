import { Monitor, Moon, Sun } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import type { Theme } from '@/theme/theme-storage'
import { useTheme } from '@/theme/useTheme'

const THEMES = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] satisfies { value: Theme; label: string; icon: typeof Sun }[]

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const { isMobile } = useSidebar()
  const CurrentIcon = resolvedTheme === 'dark' ? Moon : Sun

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton>
            <CurrentIcon />
            <span>Theme</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side={isMobile ? 'top' : 'right'} align="end">
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={(value) => {
              const choice = THEMES.find((option) => option.value === value)
              if (choice) setTheme(choice.value)
            }}
          >
            {THEMES.map(({ value, label, icon: Icon }) => (
              <DropdownMenuRadioItem key={value} value={value}>
                <Icon />
                {label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}
