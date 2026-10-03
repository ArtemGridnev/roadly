import type { ComponentProps } from 'react'
import { cn } from '../../lib/cn'

export const textControlClasses =
  'w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-ring aria-invalid:border-destructive'

export function TextInput({ className, ...props }: ComponentProps<'input'>) {
  return <input type="text" className={cn(textControlClasses, className)} {...props} />
}
