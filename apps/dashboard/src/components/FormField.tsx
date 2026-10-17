import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { fieldDescriptionId } from '@/lib/field-ids'

interface FormFieldProps {
  id: string
  label: string
  hint?: string
  error?: ReactNode
  children: ReactNode
}

export function FormField({ id, label, hint, error, children }: FormFieldProps) {
  const description = error ?? hint

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {description ? (
        <p
          id={fieldDescriptionId(id)}
          className={error ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}
        >
          {description}
        </p>
      ) : null}
    </div>
  )
}
