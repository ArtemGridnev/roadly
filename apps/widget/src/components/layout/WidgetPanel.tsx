import * as Tabs from '@radix-ui/react-tabs'
import { Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { PanelHeader } from './PanelHeader'
import { TabBar } from './TabBar'
import { DEFAULT_TAB, WIDGET_TABS, type TabId } from './tabs'
import { Button } from '../ui/Button'
import { NewRequestOverlay } from '../new-request/NewRequestOverlay'
import { RequestsView } from '../../views/RequestsView'
import { MyRequestsView } from '../../views/MyRequestsView'

const TAB_CONTENT_CLASSES =
  'min-h-0 flex-1 overflow-y-auto p-4 pb-16 focus-visible:outline-none'

interface WidgetPanelProps {
  onClose: () => void
}

export function WidgetPanel({ onClose }: WidgetPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>(DEFAULT_TAB)
  const [isComposing, setIsComposing] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const newRequestButtonRef = useRef<HTMLButtonElement>(null)
  const shouldRestoreFocus = useRef(false)

  useEffect(() => {
    if (!isComposing && shouldRestoreFocus.current) {
      shouldRestoreFocus.current = false
      newRequestButtonRef.current?.focus()
    }
  }, [isComposing])

  const openComposer = () => {
    setAnnouncement('')
    setIsComposing(true)
  }

  const closeComposer = () => {
    shouldRestoreFocus.current = true
    setIsComposing(false)
  }

  const handleSent = () => {
    setActiveTab('mine')
    setAnnouncement('Request sent')
    closeComposer()
  }

  const activeTitle = WIDGET_TABS.find((tab) => tab.id === activeTab)?.title ?? ''

  return (
    <Tabs.Root
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as TabId)}
      className="relative flex h-[min(34rem,calc(100vh-7.5rem))] w-[21rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-lg border border-border bg-background text-foreground shadow-lg"
    >
      <div inert={isComposing} className="flex min-h-0 flex-1 flex-col">
        <PanelHeader title={activeTitle} onClose={onClose} />

        <div className="relative flex min-h-0 flex-1 flex-col">
          <Tabs.Content value="requests" className={TAB_CONTENT_CLASSES}>
            <RequestsView />
          </Tabs.Content>

          <Tabs.Content value="mine" className={TAB_CONTENT_CLASSES}>
            <MyRequestsView />
          </Tabs.Content>

          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <Button
              ref={newRequestButtonRef}
              onClick={openComposer}
              className="pointer-events-auto shadow-sm"
            >
              <Plus className="size-4" aria-hidden="true" />
              New request
            </Button>
          </div>
        </div>

        <TabBar />
      </div>

      {isComposing ? <NewRequestOverlay onBack={closeComposer} onSent={handleSent} /> : null}

      <p role="status" className="sr-only">
        {announcement}
      </p>
    </Tabs.Root>
  )
}
