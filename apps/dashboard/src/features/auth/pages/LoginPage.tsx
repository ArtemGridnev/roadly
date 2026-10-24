import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router'
import { agentLoginSchema, type AgentLoginInput } from '@roadly/shared'
import { getErrorStatus } from '@/api/errors'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { fieldDescriptionId } from '@/lib/field-ids'
import { useLoginMutation } from '../api/auth-api'

const trim = (value: string) => value.trim()

export function LoginPage() {
  const [login, { error: loginError, isLoading }] = useLoginMutation()
  const formId = useId()
  const ids = {
    email: `${formId}-email`,
    password: `${formId}-password`,
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AgentLoginInput>({
    resolver: zodResolver(agentLoginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit((input) => login(input))

  const loginStatus = getErrorStatus(loginError)
  const formError = !loginError
    ? null
    : loginStatus === 401
      ? "That email and password don't match. Check them and try again."
      : loginStatus === 429
        ? 'Too many sign-in attempts. Wait a minute and try again.'
        : "You weren't signed in. Check your connection and try again."

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <h1 className="text-xl font-semibold">Sign in</h1>
      </CardHeader>

      <CardContent>
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormField
            id={ids.email}
            label="Email"
            error={errors.email && 'Enter a valid email address.'}
          >
            <Input
              id={ids.email}
              type="email"
              autoComplete="email"
              autoFocus
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? fieldDescriptionId(ids.email) : undefined}
              {...register('email', { setValueAs: trim })}
            />
          </FormField>

          <FormField
            id={ids.password}
            label="Password"
            error={errors.password && 'Enter your password. It has at least 8 characters.'}
          >
            <Input
              id={ids.password}
              type="password"
              autoComplete="current-password"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? fieldDescriptionId(ids.password) : undefined}
              {...register('password')}
            />
          </FormField>

          {formError ? (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-sm text-muted-foreground">
        New to Roadly?&nbsp;
        <Link to="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
          Create an account
        </Link>
      </CardFooter>
    </Card>
  )
}
