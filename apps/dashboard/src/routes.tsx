import type { RouteObject } from 'react-router'
import { StandaloneLayout } from './components/StandaloneLayout'
import { GuestOnly } from './features/auth/GuestOnly'
import { LoginPage } from './features/auth/LoginPage'
import { RequireAgent } from './features/auth/RequireAgent'
import { SignupPage } from './features/auth/SignupPage'
import { OnboardingPage } from './features/workspaces/OnboardingPage'
import { WorkspaceRedirect } from './features/workspaces/WorkspaceRedirect'

export const routes: RouteObject[] = [
  {
    element: <StandaloneLayout />,
    children: [
      {
        element: <GuestOnly />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/signup', element: <SignupPage /> },
        ],
      },
      {
        element: <RequireAgent />,
        children: [
          { path: '/', element: <WorkspaceRedirect /> },
          { path: '/onboarding', element: <OnboardingPage /> },
          {
            path: '/:slug/install',
            element: (
              <p className="text-sm text-muted-foreground">The Install page isn't built yet.</p>
            ),
          },
        ],
      },
    ],
  },
]
