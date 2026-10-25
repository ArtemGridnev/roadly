import { zodResolver } from '@hookform/resolvers/zod'
import {
  updateFeatureRequestSchema,
  type FeatureRequest,
  type UpdateFeatureRequestInput,
} from '@roadly/shared'
import { useId, useImperativeHandle, type Ref } from 'react'
import { useForm } from 'react-hook-form'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { fieldDescriptionId } from '@/lib/field-ids'
import { useUpdateFeatureRequestMutation } from '../feature-requests/feature-requests-api'

const trim = (value: string) => value.trim()

type EditableField = keyof Pick<UpdateFeatureRequestInput, 'title' | 'description' | 'category'>

export interface RequestFormHandle {
  isDirty: () => boolean
}

interface RequestFormProps {
  request: FeatureRequest
  ref: Ref<RequestFormHandle>
}

export function RequestForm({ request, ref }: RequestFormProps) {
  const [updateFeatureRequest, { isLoading, isError }] = useUpdateFeatureRequestMutation()
  const formId = useId()
  const ids = { title: `${formId}-title`, description: `${formId}-description`, category: `${formId}-category` }

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
      category: request.category ?? '',
    },
  })

  const { errors, isDirty, dirtyFields } = formState

  useImperativeHandle(ref, () => ({ isDirty: () => formState.isDirty }), [formState])

  const onSubmit = handleSubmit(async (values) => {
    const changes = Object.fromEntries(
      (Object.keys(dirtyFields) as EditableField[]).map((field) => [
        field,
        field === 'category' ? values.category || null : values[field],
      ]),
    )
    const result = await updateFeatureRequest({ id: request.id, changes })

    if (result.data) {
      reset(values)
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormField id={ids.title} label="Title" error={errors.title && 'Add a title.'}>
        <Input
          id={ids.title}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? fieldDescriptionId(ids.title) : undefined}
          {...register('title', { setValueAs: trim })}
        />
      </FormField>

      <FormField id={ids.description} label="Description" error={errors.description && 'Add a description.'}>
        <Textarea
          id={ids.description}
          rows={6}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? fieldDescriptionId(ids.description) : undefined}
          {...register('description', { setValueAs: trim })}
        />
      </FormField>

      <FormField id={ids.category} label="Category" hint="Optional. Leave empty to remove it.">
        <Input
          id={ids.category}
          aria-describedby={fieldDescriptionId(ids.category)}
          {...register('category', { setValueAs: trim })}
        />
      </FormField>

      {isError ? (
        <p role="alert" className="text-sm text-destructive">
          Your changes weren't saved. Check your connection and try again.
        </p>
      ) : null}

      <Button type="submit" className="self-start" disabled={!isDirty || isLoading}>
        {isLoading ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}
