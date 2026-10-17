import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card'
import { useLogoutMutation } from '../auth/auth-api'
import { CreateWorkspaceForm } from './CreateWorkspaceForm'

export function OnboardingPage() {
  const [logout, { isLoading }] = useLogoutMutation()

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <h1 className="text-xl font-semibold">Create your first workspace</h1>
        <CardDescription>Create one for your product to start collecting requests.</CardDescription>
      </CardHeader>
      <CardContent>
        <CreateWorkspaceForm />
      </CardContent>
      <CardFooter className="justify-center">
        <Button variant="ghost" size="sm" disabled={isLoading} onClick={() => logout()}>
          {isLoading ? 'Signing out…' : 'Sign out'}
        </Button>
      </CardFooter>
    </Card>
  )
}
