import { useState } from 'react'
import type { WidgetTheme } from '@roadly/shared'
import { useResolvedTheme } from '../theme/use-resolved-theme'
import { WidgetLauncher } from '../components/launcher/WidgetLauncher'
import { WidgetPanel } from '../components/layout/WidgetPanel'

type PanelState = 'closed' | 'open' | 'closing'

// Mobile and reduced motion skip the animation, so animationend would never fire.
const shouldAnimate = () =>
  !window.matchMedia('(prefers-reduced-motion: reduce), (width < 40rem)').matches

interface WidgetRootProps {
  theme: WidgetTheme
}

export function WidgetRoot({ theme }: WidgetRootProps) {
  const [panelState, setPanelState] = useState<PanelState>('closed')
  const resolvedTheme = useResolvedTheme(theme)
  const isOpen = panelState === 'open'

  const togglePanel = () => {
    if (isOpen) {
      setPanelState(shouldAnimate() ? 'closing' : 'closed')
    } else {
      setPanelState('open')
    }
  }

  return (
    <div
      data-roadly-theme={resolvedTheme}
      className="fixed right-4 bottom-4 z-[2147483000] flex flex-col items-end gap-3 font-sans text-sm"
    >
      {panelState !== 'closed' ? (
        <WidgetPanel
          isClosing={panelState === 'closing'}
          onClose={() => setPanelState('closed')}
          onExited={() => setPanelState('closed')}
        />
      ) : null}
      <WidgetLauncher isOpen={isOpen} onToggle={togglePanel} />
    </div>
  )
}
