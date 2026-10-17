import { Button } from '@/components/ui/button'

interface LoadErrorProps {
  onRetry: () => void
}

export function LoadError({ onRetry }: LoadErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 text-center">
      <p className="text-sm text-muted-foreground">
        We couldn't reach Roadly. Check your connection and try again.
      </p>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
