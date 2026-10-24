import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card'
import { useLogoutMutation } from '../../auth/api/auth-api'
import { CreateWorkspaceForm } from '../components/CreateWorkspaceForm'

export function OnboardingPage() {
  const [logout, { isLoading }] = useLogoutMutation()
  const navigate = useNavigate()

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <h1 className="text-xl font-semibold">Create your first workspace</h1>
        <CardDescription>Create one for your product to start collecting requests.</CardDescription>
      </CardHeader>
      <CardContent>
        <CreateWorkspaceForm
          onCreated={(workspace) => navigate(`/${workspace.slug}/install`, { replace: true })}
        />
      </CardContent>
      <CardFooter className="justify-center">
        <Button variant="ghost" size="sm" disabled={isLoading} onClick={() => logout()}>
          {isLoading ? 'Signing out…' : 'Sign out'}
        </Button>
      </CardFooter>
    </Card>
  )
}
