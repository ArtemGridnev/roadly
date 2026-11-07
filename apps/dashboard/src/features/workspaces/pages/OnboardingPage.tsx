import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card'
import { useLogoutMutation } from '../../auth/api/auth-api'
import { CreateWorkspaceForm } from '../components/CreateWorkspaceForm'

export function OnboardingPage() {
  const { t } = useTranslation()
  const [logout, { isLoading }] = useLogoutMutation()
  const navigate = useNavigate()

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <h1 className="text-xl font-semibold">{t('workspaces.onboarding.title')}</h1>
        <CardDescription>{t('workspaces.onboarding.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <CreateWorkspaceForm
          onCreated={(workspace) => navigate(`/${workspace.slug}/install`, { replace: true })}
        />
      </CardContent>
      <CardFooter className="justify-center">
        <Button variant="ghost" size="sm" disabled={isLoading} onClick={() => logout()}>
          {isLoading ? t('common.signingOut') : t('common.signOut')}
        </Button>
      </CardFooter>
    </Card>
  )
}
