import { useId } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router'
import { createAgentSchema, type CreateAgentInput } from '@roadly/shared'
import { getErrorStatus } from '@/api/errors'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/i18n/useLanguage'
import { fieldDescriptionId } from '@/lib/field-ids'
import { useSignupMutation } from '../api/auth-api'

const PASSWORD_RULES = [
  { key: 'length', test: (value: string) => value.length >= 8 },
  { key: 'lowercase', test: (value: string) => /[a-z]/.test(value) },
  { key: 'uppercase', test: (value: string) => /[A-Z]/.test(value) },
  { key: 'number', test: (value: string) => /[0-9]/.test(value) },
] as const

const trim = (value: string) => value.trim()

export function SignupPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
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
    const result = await signup({ ...input, language })

    if (getErrorStatus(result.error) === 409) {
      setError('email', { type: 'taken' })
    }
  })

  const signupStatus = getErrorStatus(signupError)
  const formError =
    !signupError || signupStatus === 409
      ? null
      : signupStatus === 429
        ? t('auth.signup.tooManyAttempts')
        : t('auth.signup.failed')

  const emailError =
    errors.email?.type === 'taken' ? (
      <>
        {t('auth.signup.emailTaken')}{' '}
        <Link to="/login" className="font-medium underline underline-offset-4">
          {t('auth.signup.signInInstead')}
        </Link>
      </>
    ) : errors.email ? (
      t('auth.invalidEmail')
    ) : undefined

  const passwordHint = t('auth.signup.passwordHint')
  const missingPasswordRules = PASSWORD_RULES.filter((rule) => !rule.test(password)).map((rule) =>
    t(`auth.signup.passwordRules.${rule.key}`),
  )
  const passwordError = missingPasswordRules.length
    ? t('auth.signup.passwordNeeds', {
        list: new Intl.ListFormat(language, { type: 'conjunction' }).format(missingPasswordRules),
      })
    : passwordHint

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <h1 className="text-xl font-semibold">{t('auth.signup.title')}</h1>
        <CardDescription>{t('auth.signup.description')}</CardDescription>
      </CardHeader>

      <CardContent>
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormField id={ids.name} label={t('auth.signup.name')} error={errors.name && t('auth.signup.nameError')}>
            <Input
              id={ids.name}
              autoComplete="name"
              autoFocus
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? fieldDescriptionId(ids.name) : undefined}
              {...register('name', { setValueAs: trim })}
            />
          </FormField>

          <FormField id={ids.email} label={t('auth.email')} error={emailError}>
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
            label={t('auth.password')}
            hint={passwordHint}
            error={errors.password && passwordError}
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
            {isLoading ? t('auth.signup.submitting') : t('auth.signup.submit')}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-sm text-muted-foreground">
        {t('auth.signup.haveAccount')}&nbsp;
        <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          {t('auth.signup.signIn')}
        </Link>
      </CardFooter>
    </Card>
  )
}
