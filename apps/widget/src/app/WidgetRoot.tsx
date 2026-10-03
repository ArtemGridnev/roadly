import { useState } from 'react'
import type { WidgetTheme } from '@roadly/shared'
import { useResolvedTheme } from '../theme/use-resolved-theme'
import { WidgetLauncher } from '../components/launcher/WidgetLauncher'
import { WidgetPanel } from '../components/layout/WidgetPanel'

interface WidgetRootProps {
  theme: WidgetTheme
}

export function WidgetRoot({ theme }: WidgetRootProps) {
  const [isOpen, setIsOpen] = useState(false)
  const resolvedTheme = useResolvedTheme(theme)

  return (
    <div
      data-roadly-theme={resolvedTheme}
      className="fixed right-4 bottom-4 z-[2147483000] flex flex-col items-end gap-3 font-sans text-sm"
    >
      {isOpen ? <WidgetPanel onClose={() => setIsOpen(false)} /> : null}
      <WidgetLauncher isOpen={isOpen} onToggle={() => setIsOpen((open) => !open)} />
    </div>
  )
}
