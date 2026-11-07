import type { ReactNode } from 'react'
import { fieldErrorId } from '../../lib/field-ids'

interface FormFieldProps {
  id: string
  label: string
  error?: string
  children: ReactNode
}

export function FormField({ id, label, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p id={fieldErrorId(id)} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
