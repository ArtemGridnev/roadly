import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { useLogoutMutation } from '../auth/auth-api'

export function OnboardingPage() {
  const [logout, { isLoading }] = useLogoutMutation()

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="text-sm text-muted-foreground">
        You're not in a workspace yet. Create one for your product to start collecting requests.
      </CardContent>
      <CardFooter className="justify-center">
        <Button variant="ghost" size="sm" disabled={isLoading} onClick={() => logout()}>
          {isLoading ? 'Signing out…' : 'Sign out'}
        </Button>
      </CardFooter>
    </Card>
  )
}
