import { Card, CardContent } from '@/components/ui/card'

export function OnboardingPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardContent className="text-sm text-muted-foreground">
        You're not in a workspace yet. Create one for your product to start collecting requests.
      </CardContent>
    </Card>
  )
}
