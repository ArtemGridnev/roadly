import { zodResolver } from '@hookform/resolvers/zod'
import {
  updateFeatureRequestSchema,
  type FeatureRequest,
  type UpdateFeatureRequestInput,
} from '@roadly/shared'
import { useId, useImperativeHandle, type Ref } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { fieldDescriptionId } from '@/lib/field-ids'
import { useUpdateFeatureRequestMutation } from '../../feature-requests/api/feature-requests-api'

const trim = (value: string) => value.trim()

type EditableField = keyof Pick<UpdateFeatureRequestInput, 'title' | 'description'>

export interface RequestFormHandle {
  isDirty: () => boolean
}

interface RequestFormProps {
  request: FeatureRequest
  ref: Ref<RequestFormHandle>
}

export function RequestForm({ request, ref }: RequestFormProps) {
  const { t } = useTranslation()
  const [updateFeatureRequest, { isLoading, isError }] = useUpdateFeatureRequestMutation()
  const formId = useId()
  const ids = { title: `${formId}-title`, description: `${formId}-description` }

  const {
    register,
    handleSubmit,
    reset,
    formState,
  } = useForm<UpdateFeatureRequestInput>({
    resolver: zodResolver(updateFeatureRequestSchema),
    defaultValues: {
      title: request.title,
      description: request.description,
    },
  })

  const { errors, isDirty, dirtyFields } = formState

  useImperativeHandle(ref, () => ({ isDirty: () => formState.isDirty }), [formState])

  const onSubmit = handleSubmit(async (values) => {
    const changes = Object.fromEntries(
      (Object.keys(dirtyFields) as EditableField[]).map((field) => [field, values[field]]),
    )
    const result = await updateFeatureRequest({ id: request.id, changes })

    if (result.data) {
      reset(values)
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormField id={ids.title} label={t('roadmap.form.title')} error={errors.title && t('roadmap.form.titleError')}>
        <Input
          id={ids.title}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? fieldDescriptionId(ids.title) : undefined}
          {...register('title', { setValueAs: trim })}
        />
      </FormField>

      <FormField id={ids.description} label={t('roadmap.form.description')} error={errors.description && t('roadmap.form.descriptionError')}>
        <Textarea
          id={ids.description}
          rows={6}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? fieldDescriptionId(ids.description) : undefined}
          {...register('description', { setValueAs: trim })}
        />
      </FormField>

      {isError ? (
        <p role="alert" className="text-sm text-destructive">
          {t('roadmap.form.failed')}
        </p>
      ) : null}

      <Button type="submit" className="self-start" disabled={!isDirty || isLoading}>
        {isLoading ? t('roadmap.form.submitting') : t('roadmap.form.submit')}
      </Button>
    </form>
  )
}
