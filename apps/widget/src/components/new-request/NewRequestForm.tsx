import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createWidgetFeatureRequestSchema,
  type CreateWidgetFeatureRequestInput,
} from '@roadly/shared'
import { useCreateFeatureRequest } from '../../api/feature-requests'
import { useWidgetSession } from '../../session/widget-session'
import { Button } from '../ui/Button'
import { FormField } from '../ui/FormField'
import { fieldErrorId } from '../../lib/field-ids'
import { TextInput } from '../ui/TextInput'
import { TextArea } from '../ui/TextArea'

const FIELD_ERRORS = {
  title: 'Add a short title.',
  description: 'Describe what you need and why.',
} as const

const trim = (value: string) => value.trim()
const trimToOptional = (value: string) => value.trim() || undefined

interface NewRequestFormProps {
  onSent: () => void
}

export function NewRequestForm({ onSent }: NewRequestFormProps) {
  const { widgetKey, contact, identifyError } = useWidgetSession()
  const createFeatureRequest = useCreateFeatureRequest()
  const formId = useId()
  const ids = {
    title: `${formId}-title`,
    description: `${formId}-description`,
    category: `${formId}-category`,
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateWidgetFeatureRequestInput>({
    resolver: zodResolver(createWidgetFeatureRequestSchema),
    defaultValues: { title: '', description: '' },
  })

  const onSubmit = handleSubmit((input) => {
    if (!contact) {
      return
    }

    createFeatureRequest.mutate(
      { widgetKey, contactId: contact.id, input },
      { onSuccess: onSent },
    )
  })

  const errorMessage = identifyError
    ? "We couldn't identify your account, so requests can't be sent right now."
    : createFeatureRequest.isError
      ? "Your request wasn't sent. Check your connection and try again."
      : null

  return (
    <form noValidate onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <FormField id={ids.title} label="Title" error={errors.title && FIELD_ERRORS.title}>
          <TextInput
            id={ids.title}
            autoFocus
            placeholder="e.g. Export reports to CSV"
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? fieldErrorId(ids.title) : undefined}
            {...register('title', { setValueAs: trim })}
          />
        </FormField>

        <FormField
          id={ids.description}
          label="Description"
          error={errors.description && FIELD_ERRORS.description}
        >
          <TextArea
            id={ids.description}
            placeholder="What are you trying to do, and what gets in the way today?"
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={errors.description ? fieldErrorId(ids.description) : undefined}
            {...register('description', { setValueAs: trim })}
          />
        </FormField>

        <FormField id={ids.category} label="Category" optional>
          <TextInput
            id={ids.category}
            placeholder="e.g. Reporting"
            {...register('category', { setValueAs: trimToOptional })}
          />
        </FormField>
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-border bg-card p-3">
        {errorMessage ? (
          <p role="alert" className="text-xs text-destructive">
            {errorMessage}
          </p>
        ) : null}
        <Button
          type="submit"
          className="self-end"
          disabled={!contact || createFeatureRequest.isPending}
        >
          {createFeatureRequest.isPending ? 'Sending…' : 'Send request'}
        </Button>
      </div>
    </form>
  )
}
