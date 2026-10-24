import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createWorkspaceSchema, type CreateWorkspaceInput, type Workspace } from '@roadly/shared'
import { getErrorStatus } from '@/api/errors'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fieldDescriptionId } from '@/lib/field-ids'
import { nextSlug, slugify } from './slug'
import { useCreateWorkspaceMutation } from './workspaces-api'

const SLUG_HINT = "Lowercase letters, numbers, and hyphens. Can't be changed later."

const trim = (value: string) => value.trim()

interface CreateWorkspaceFormProps {
  onCreated: (workspace: Workspace) => void
}

export function CreateWorkspaceForm({ onCreated }: CreateWorkspaceFormProps) {
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
      setError('slug', { type: 'server', message: `That URL is taken. Try ${nextSlug(input.slug)}.` })
    } else if (status === 400) {
      setError('slug', {
        type: 'server',
        message: "That URL can't be used. Use 3–40 lowercase letters, numbers, and hyphens.",
      })
    }
  })

  const createStatus = getErrorStatus(createError)
  const formError =
    createError && createStatus !== 409 && createStatus !== 400
      ? "Your workspace wasn't created. Check your connection and try again."
      : null

  const slugError =
    errors.slug?.type === 'server' ? errors.slug.message : errors.slug && 'Add a URL.'

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormField id={ids.name} label="Name" error={errors.name && 'Add a name.'}>
        <Input
          id={ids.name}
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

      <FormField id={ids.slug} label="URL" hint={SLUG_HINT} error={slugError}>
        <Input
          id={ids.slug}
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
        {isLoading ? 'Creating workspace…' : 'Create workspace'}
      </Button>
    </form>
  )
}
