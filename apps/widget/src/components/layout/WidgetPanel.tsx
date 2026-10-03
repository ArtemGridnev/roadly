import * as Tabs from '@radix-ui/react-tabs'
import { useState } from 'react'
import { PanelHeader } from './PanelHeader'
import { TabBar } from './TabBar'
import { DEFAULT_TAB, WIDGET_TABS, type TabId } from './tabs'
import { RequestsView } from '../../views/RequestsView'
import { MyRequestsView } from '../../views/MyRequestsView'

const TAB_CONTENT_CLASSES =
  'min-h-0 flex-1 overflow-y-auto p-4 focus-visible:outline-none'

interface WidgetPanelProps {
  onClose: () => void
}

export function WidgetPanel({ onClose }: WidgetPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>(DEFAULT_TAB)

  const activeTitle = WIDGET_TABS.find((tab) => tab.id === activeTab)?.title ?? ''

  return (
    <Tabs.Root
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as TabId)}
      className="flex h-[min(34rem,calc(100vh-7.5rem))] w-[21rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-lg border border-border bg-background text-foreground shadow-lg"
    >
      <PanelHeader title={activeTitle} onClose={onClose} />

      <Tabs.Content value="requests" className={TAB_CONTENT_CLASSES}>
        <RequestsView />
      </Tabs.Content>

      <Tabs.Content value="mine" className={TAB_CONTENT_CLASSES}>
        <MyRequestsView />
      </Tabs.Content>

      <TabBar />
    </Tabs.Root>
  )
}
