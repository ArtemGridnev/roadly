import type { ComponentProps } from 'react'
import { cn } from '../../lib/cn'
import { textControlClasses } from './TextInput'

export function TextArea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(textControlClasses, 'min-h-28 resize-none', className)} {...props} />
}
