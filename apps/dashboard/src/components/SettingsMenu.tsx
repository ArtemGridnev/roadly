import { languageSchema } from '@roadly/shared'
import { Languages, Monitor, Moon, Settings, Sun, type LucideIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { LANGUAGE_NAMES } from '@/i18n/i18n'
import { useInlineSides } from '@/i18n/useInlineSides'
import { useLanguage } from '@/i18n/useLanguage'
import type { Theme } from '@/theme/theme-storage'
import { useTheme } from '@/theme/useTheme'

const THEMES = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
] satisfies { value: Theme; icon: LucideIcon }[]

interface RadioSubmenuProps<T extends string> {
  icon: LucideIcon
  label: string
  value: T
  options: { value: T; label: string; icon?: LucideIcon; lang?: string }[]
  onChange: (value: T) => void
}

function RadioSubmenu<T extends string>({ icon: Icon, label, value, options, onChange }: RadioSubmenuProps<T>) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Icon />
        {label}
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as T)}>
            {options.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value} lang={option.lang}>
                {option.icon ? <option.icon /> : null}
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  )
}

type SettingsMenuContentProps = Pick<ComponentProps<typeof DropdownMenuContent>, 'side' | 'align'>

function SettingsMenuContent({ side, align }: SettingsMenuContentProps) {
  const { t } = useTranslation()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()

  return (
    <DropdownMenuContent side={side} align={align} className="w-48">
      <RadioSubmenu
        icon={resolvedTheme === 'dark' ? Moon : Sun}
        label={t('settings.theme')}
        value={theme}
        onChange={setTheme}
        options={THEMES.map(({ value, icon }) => ({ value, icon, label: t(`settings.${value}`) }))}
      />
      <RadioSubmenu
        icon={Languages}
        label={t('settings.language')}
        value={language}
        onChange={setLanguage}
        options={languageSchema.options.map((value) => ({ value, lang: value, label: LANGUAGE_NAMES[value] }))}
      />
    </DropdownMenuContent>
  )
}

export function SidebarSettingsMenu() {
  const { t } = useTranslation()
  const { isMobile } = useSidebar()
  const { end } = useInlineSides()

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton>
            <Settings />
            <span>{t('settings.title')}</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <SettingsMenuContent side={isMobile ? 'top' : end} align="end" />
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

export function SettingsMenu() {
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('settings.title')}>
          <Settings />
        </Button>
      </DropdownMenuTrigger>
      <SettingsMenuContent align="end" />
    </DropdownMenu>
  )
}
