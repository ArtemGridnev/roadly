import { X } from 'lucide-react'

interface PanelHeaderProps {
  title: string
  onClose: () => void
}

export function PanelHeader({ title, onClose }: PanelHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-4 py-3">
      <h2 className="text-base font-semibold text-card-foreground">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close Roadly"
        className="-mr-1 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </header>
  )
}
