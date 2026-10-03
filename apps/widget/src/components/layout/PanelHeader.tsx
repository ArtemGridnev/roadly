import { ArrowLeft, X } from 'lucide-react'

const ICON_BUTTON_CLASSES =
  'rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

interface PanelHeaderProps {
  title: string
  titleId?: string
  onBack?: () => void
  onClose?: () => void
}

export function PanelHeader({ title, titleId, onBack, onClose }: PanelHeaderProps) {
  return (
    <header className="flex shrink-0 items-center gap-2 border-b border-border bg-card px-4 py-3">
      {onBack ? (
        <button type="button" onClick={onBack} aria-label="Back" className={`-ml-1 ${ICON_BUTTON_CLASSES}`}>
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>
      ) : null}
      <h2 id={titleId} className="flex-1 text-base font-semibold text-card-foreground">
        {title}
      </h2>
      {onClose ? (
        <button type="button" onClick={onClose} aria-label="Close Roadly" className={`-mr-1 ${ICON_BUTTON_CLASSES}`}>
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </header>
  )
}
