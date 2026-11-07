import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import { createWorkspaceSchema, type CreateWorkspaceInput, type Workspace } from '@roadly/shared'
import { getErrorStatus } from '@/api/errors'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fieldDescriptionId } from '@/lib/field-ids'
import { nextSlug, slugify } from '../utils/slug'
import { useCreateWorkspaceMutation } from '../api/workspaces-api'

const trim = (value: string) => value.trim()

interface CreateWorkspaceFormProps {
  onCreated: (workspace: Workspace) => void
}

export function CreateWorkspaceForm({ onCreated }: CreateWorkspaceFormProps) {
  const { t } = useTranslation()
  const [createWorkspace, { error: createError, isLoading }] = useCreateWorkspaceMutation()
  const [slugEdited, setSlugEdited] = useState(false)
  const formId = useId()
  const ids = { name: `${formId}-name`, slug: `${formId}-slug` }

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitted },
  } = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: { name: '', slug: '' },
  })

  const onSubmit = handleSubmit(async (input) => {
    const result = await createWorkspace(input)

    if (result.data) {
      onCreated(result.data)
      return
    }

    const status = getErrorStatus(result.error)
    if (status === 409) {
      setError('slug', { type: 'server', message: t('workspaces.form.urlTaken', { slug: nextSlug(input.slug) }) })
    } else if (status === 400) {
      setError('slug', {
        type: 'server',
        message: t('workspaces.form.urlInvalid'),
      })
    }
  })

  const createStatus = getErrorStatus(createError)
  const formError =
    createError && createStatus !== 409 && createStatus !== 400
      ? t('workspaces.form.failed')
      : null

  const slugError =
    errors.slug?.type === 'server' ? errors.slug.message : errors.slug && t('workspaces.form.urlError')

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormField id={ids.name} label={t('workspaces.form.name')} error={errors.name && t('workspaces.form.nameError')}>
        <Input
          id={ids.name}
          dir="auto"
          autoComplete="organization"
          autoFocus
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? fieldDescriptionId(ids.name) : undefined}
          {...register('name', {
            setValueAs: trim,
            onChange: (event) => {
              if (!slugEdited) {
                setValue('slug', slugify(event.target.value), { shouldValidate: isSubmitted })
              }
            },
          })}
        />
      </FormField>

      <FormField id={ids.slug} label={t('workspaces.form.url')} hint={t('workspaces.form.urlHint')} error={slugError}>
        <Input
          id={ids.slug}
          dir="ltr"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={errors.slug ? true : undefined}
          aria-describedby={fieldDescriptionId(ids.slug)}
          {...register('slug', { setValueAs: trim, onChange: () => setSlugEdited(true) })}
        />
      </FormField>

      {formError ? (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? t('workspaces.form.submitting') : t('workspaces.form.submit')}
      </Button>
    </form>
  )
}
