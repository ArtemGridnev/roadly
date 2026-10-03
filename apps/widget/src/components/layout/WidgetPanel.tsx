import * as Tabs from '@radix-ui/react-tabs'
import { Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { PanelHeader } from './PanelHeader'
import { TabBar } from './TabBar'
import { DEFAULT_TAB, WIDGET_TABS, type TabId } from './tabs'
import { Button } from '../ui/Button'
import { NewRequestOverlay } from '../new-request/NewRequestOverlay'
import { RequestDetailOverlay } from '../requests/RequestDetailOverlay'
import { RequestsView } from '../../views/RequestsView'
import { MyRequestsView } from '../../views/MyRequestsView'

const TAB_CONTENT_CLASSES = 'min-h-0 flex-1 overflow-y-auto p-4 focus-visible:outline-none'

interface WidgetPanelProps {
  isClosing: boolean
  onClose: () => void
  onExited: () => void
}

export function WidgetPanel({ isClosing, onClose, onExited }: WidgetPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>(DEFAULT_TAB)
  const [isComposing, setIsComposing] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const newRequestButtonRef = useRef<HTMLButtonElement>(null)
  const shouldRestoreFocus = useRef(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const detailTriggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isComposing && shouldRestoreFocus.current) {
      shouldRestoreFocus.current = false
      newRequestButtonRef.current?.focus()
    }
  }, [isComposing])

  useEffect(() => {
    if (!selectedRequestId && detailTriggerRef.current) {
      detailTriggerRef.current.focus()
      detailTriggerRef.current = null
    }
  }, [selectedRequestId])

  const openDetails = (requestId: string, trigger: HTMLElement | null) => {
    detailTriggerRef.current = trigger
    setSelectedRequestId(requestId)
  }

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

  const isOverlayOpen = isComposing || selectedRequestId !== null
  const activeTitle = WIDGET_TABS.find((tab) => tab.id === activeTab)?.title ?? ''

  return (
    <Tabs.Root
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as TabId)}
      inert={isClosing}
      data-state={isClosing ? 'closing' : 'open'}
      onAnimationEnd={(event) => {
        if (isClosing && event.target === event.currentTarget) onExited()
      }}
      className="relative flex h-[min(38rem,calc(100vh-7.5rem))] w-[24rem] max-w-[calc(100vw-2rem)] origin-bottom-right animate-panel-in flex-col overflow-clip rounded-lg border border-border bg-background text-foreground shadow-lg data-[state=closing]:animate-panel-out max-sm:fixed max-sm:inset-0 max-sm:h-auto max-sm:w-auto max-sm:max-w-none max-sm:rounded-none max-sm:animate-none max-sm:border-0"
    >
      <div inert={isOverlayOpen} className="flex min-h-0 flex-1 flex-col">
        <PanelHeader title={activeTitle} onClose={onClose} />

        <div className="relative flex min-h-0 flex-1 flex-col">
          <Tabs.Content value="requests" className={TAB_CONTENT_CLASSES}>
            <RequestsView onSelectRequest={openDetails} />
          </Tabs.Content>

          <Tabs.Content value="mine" className={`${TAB_CONTENT_CLASSES} pb-16`}>
            <MyRequestsView onSelectRequest={openDetails} />
          </Tabs.Content>

          {activeTab === 'mine' ? (
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
          ) : null}
        </div>

        <TabBar />
      </div>

      {isComposing ? <NewRequestOverlay onBack={closeComposer} onSent={handleSent} /> : null}

      {selectedRequestId ? (
        <RequestDetailOverlay
          requestId={selectedRequestId}
          onBack={() => setSelectedRequestId(null)}
        />
      ) : null}

      <p role="status" className="sr-only">
        {announcement}
      </p>
    </Tabs.Root>
  )
}
