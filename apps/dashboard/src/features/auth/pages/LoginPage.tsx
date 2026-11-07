import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
      ? t('auth.login.invalidCredentials')
      : loginStatus === 429
        ? t('auth.login.tooManyAttempts')
        : t('auth.login.failed')

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <h1 className="text-xl font-semibold">{t('auth.login.title')}</h1>
      </CardHeader>

      <CardContent>
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormField
            id={ids.email}
            label={t('auth.email')}
            error={errors.email && t('auth.invalidEmail')}
          >
            <Input
              id={ids.email}
              type="email"
              dir="ltr"
              autoComplete="email"
              autoFocus
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? fieldDescriptionId(ids.email) : undefined}
              {...register('email', { setValueAs: trim })}
            />
          </FormField>

          <FormField
            id={ids.password}
            label={t('auth.password')}
            error={errors.password && t('auth.login.passwordError')}
          >
            <Input
              id={ids.password}
              type="password"
              dir="ltr"
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
            {isLoading ? t('auth.login.submitting') : t('auth.login.submit')}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-sm text-muted-foreground">
        {t('auth.login.newToRoadly')}&nbsp;
        <Link to="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
          {t('auth.login.createAccount')}
        </Link>
      </CardFooter>
    </Card>
  )
}
