import { useId, type KeyboardEvent } from 'react'
import { PanelHeader } from '../layout/PanelHeader'
import { NewRequestForm } from './NewRequestForm'

interface NewRequestOverlayProps {
  onBack: () => void
  onSent: () => void
}

export function NewRequestOverlay({ onBack, onSent }: NewRequestOverlayProps) {
  const titleId = useId()

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onBack()
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={handleKeyDown}
      className="absolute inset-0 z-10 flex animate-overlay-in flex-col bg-background"
    >
      <PanelHeader title="New request" titleId={titleId} onBack={onBack} />
      <NewRequestForm onSent={onSent} />
    </div>
  )
}
