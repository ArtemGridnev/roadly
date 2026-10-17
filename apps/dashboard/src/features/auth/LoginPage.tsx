import { Link } from 'react-router'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <h1 className="text-xl font-semibold">Sign in</h1>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Sign-in isn't built yet.{' '}
        <Link to="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
          Create an account
        </Link>
      </CardContent>
    </Card>
  )
}
