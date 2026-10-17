import type { RouteObject } from 'react-router'
import { StandaloneLayout } from './components/StandaloneLayout'
import { GuestOnly } from './features/auth/GuestOnly'
import { LoginPage } from './features/auth/LoginPage'
import { RequireAgent } from './features/auth/RequireAgent'
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
        ],
      },
      {
        element: <RequireAgent />,
        children: [
          { path: '/', element: <WorkspaceRedirect /> },
          { path: '/onboarding', element: <OnboardingPage /> },
        ],
      },
    ],
  },
]
