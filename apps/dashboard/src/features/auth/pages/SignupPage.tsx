import { useId } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router'
import { createAgentSchema, type CreateAgentInput } from '@roadly/shared'
import { getErrorStatus } from '@/api/errors'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { fieldDescriptionId } from '@/lib/field-ids'
import { useSignupMutation } from '../api/auth-api'

const PASSWORD_HINT =
  'At least 8 characters, with a lowercase letter, an uppercase letter, and a number.'

const PASSWORD_RULES = [
  { label: 'at least 8 characters', test: (value: string) => value.length >= 8 },
  { label: 'a lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { label: 'an uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'a number', test: (value: string) => /[0-9]/.test(value) },
]

const listFormat = new Intl.ListFormat('en', { type: 'conjunction' })

function passwordError(password: string) {
  const missing = PASSWORD_RULES.filter((rule) => !rule.test(password)).map((rule) => rule.label)
  return missing.length ? `Needs ${listFormat.format(missing)}.` : PASSWORD_HINT
}

const trim = (value: string) => value.trim()

export function SignupPage() {
  const [signup, { error: signupError, isLoading }] = useSignupMutation()
  const formId = useId()
  const ids = {
    name: `${formId}-name`,
    email: `${formId}-email`,
    password: `${formId}-password`,
  }

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<CreateAgentInput>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: { name: '', email: '', password: '' },
  })
  const password = useWatch({ control, name: 'password' })

  const onSubmit = handleSubmit(async (input) => {
    const result = await signup(input)

    if (getErrorStatus(result.error) === 409) {
      setError('email', { type: 'taken' })
    }
  })

  const signupStatus = getErrorStatus(signupError)
  const formError =
    !signupError || signupStatus === 409
      ? null
      : signupStatus === 429
        ? 'Too many sign-up attempts. Try again in an hour.'
        : "Your account wasn't created. Check your connection and try again."

  const emailError =
    errors.email?.type === 'taken' ? (
      <>
        An account with that email already exists.{' '}
        <Link to="/login" className="font-medium underline underline-offset-4">
          Sign in instead
        </Link>
      </>
    ) : errors.email ? (
      'Enter a valid email address.'
    ) : undefined

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <h1 className="text-xl font-semibold">Create your account</h1>
        <CardDescription>Start collecting feature requests from your users.</CardDescription>
      </CardHeader>

      <CardContent>
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormField id={ids.name} label="Name" error={errors.name && 'Add your name.'}>
            <Input
              id={ids.name}
              autoComplete="name"
              autoFocus
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? fieldDescriptionId(ids.name) : undefined}
              {...register('name', { setValueAs: trim })}
            />
          </FormField>

          <FormField id={ids.email} label="Email" error={emailError}>
            <Input
              id={ids.email}
              type="email"
              autoComplete="email"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? fieldDescriptionId(ids.email) : undefined}
              {...register('email', { setValueAs: trim })}
            />
          </FormField>

          <FormField
            id={ids.password}
            label="Password"
            hint={PASSWORD_HINT}
            error={errors.password && passwordError(password)}
          >
            <Input
              id={ids.password}
              type="password"
              autoComplete="new-password"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={fieldDescriptionId(ids.password)}
              {...register('password')}
            />
          </FormField>

          {formError ? (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-sm text-muted-foreground">
        Already have an account?&nbsp;
        <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </CardFooter>
    </Card>
  )
}
