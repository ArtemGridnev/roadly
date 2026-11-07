import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createWidgetFeatureRequestSchema,
  type CreateWidgetFeatureRequestInput,
} from '@roadly/shared'
import { useCreateFeatureRequest } from '../../api/feature-requests'
import { useLanguage } from '../../i18n/use-language'
import { useWidgetSession } from '../../session/widget-session'
import { Button } from '../ui/Button'
import { FormField } from '../ui/FormField'
import { fieldErrorId } from '../../lib/field-ids'
import { TextInput } from '../ui/TextInput'
import { TextArea } from '../ui/TextArea'

const trim = (value: string) => value.trim()

interface NewRequestFormProps {
  onSent: () => void
}

export function NewRequestForm({ onSent }: NewRequestFormProps) {
  const { t } = useLanguage()
  const { widgetKey, contact, identifyError } = useWidgetSession()
  const createFeatureRequest = useCreateFeatureRequest()
  const formId = useId()
  const ids = {
    title: `${formId}-title`,
    description: `${formId}-description`,
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
    ? t.newRequest.identifyFailed
    : createFeatureRequest.isError
      ? t.newRequest.sendFailed
      : null

  return (
    <form noValidate onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <FormField id={ids.title} label={t.newRequest.titleLabel} error={errors.title && t.newRequest.titleError}>
          <TextInput
            id={ids.title}
            autoFocus
            dir="auto"
            placeholder={t.newRequest.titlePlaceholder}
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? fieldErrorId(ids.title) : undefined}
            {...register('title', { setValueAs: trim })}
          />
        </FormField>

        <FormField
          id={ids.description}
          label={t.newRequest.descriptionLabel}
          error={errors.description && t.newRequest.descriptionError}
        >
          <TextArea
            id={ids.description}
            dir="auto"
            placeholder={t.newRequest.descriptionPlaceholder}
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={errors.description ? fieldErrorId(ids.description) : undefined}
            {...register('description', { setValueAs: trim })}
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
          {createFeatureRequest.isPending ? t.newRequest.submitting : t.newRequest.submit}
        </Button>
      </div>
    </form>
  )
}
