import { MessageSquarePlus, X } from 'lucide-react'
import { useLanguage } from '../../i18n/use-language'

interface WidgetLauncherProps {
  isOpen: boolean
  onToggle: () => void
}

export function WidgetLauncher({ isOpen, onToggle }: WidgetLauncherProps) {
  const { t } = useLanguage()
  const Icon = isOpen ? X : MessageSquarePlus

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-label={isOpen ? t.panel.close : t.panel.open}
      className="inline-flex items-center gap-2 rounded-full bg-primary py-3 ps-3.5 pe-4 text-sm font-medium text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-expanded:pe-3.5 max-sm:aria-expanded:hidden"
    >
      <Icon className="size-5" aria-hidden="true" />
      {isOpen ? null : t.panel.feedback}
    </button>
  )
}
