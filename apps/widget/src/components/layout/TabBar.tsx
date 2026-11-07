import * as Tabs from '@radix-ui/react-tabs'
import { useLanguage } from '../../i18n/use-language'
import { WIDGET_TABS } from './tabs'

export function TabBar() {
  const { t } = useLanguage()

  return (
    <Tabs.List
      aria-label={t.tabs.label}
      className="flex shrink-0 border-t border-border bg-card"
    >
      {WIDGET_TABS.map(({ id, icon: Icon }) => (
        <Tabs.Trigger
          key={id}
          value={id}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring data-[state=active]:text-primary"
        >
          <Icon className="size-5" aria-hidden="true" />
          {t.tabs[id].label}
        </Tabs.Trigger>
      ))}
    </Tabs.List>
  )
}
