import { Navigate, type RouteObject } from 'react-router'
import { AppLayout, type PageHandle } from './components/AppLayout'
import { StandaloneLayout } from './components/StandaloneLayout'
import { GuestOnly } from './features/auth/GuestOnly'
import { LoginPage } from './features/auth/LoginPage'
import { RequireAgent } from './features/auth/RequireAgent'
import { InstallPage } from './features/install/InstallPage'
import { SignupPage } from './features/auth/SignupPage'
import { OnboardingPage } from './features/workspaces/OnboardingPage'
import { RequireActiveWorkspace } from './features/workspaces/RequireActiveWorkspace'
import { RequireNoWorkspace } from './features/workspaces/RequireNoWorkspace'
import { WorkspaceRedirect } from './features/workspaces/WorkspaceRedirect'
import { WorkspaceRoute } from './features/workspaces/WorkspaceRoute'

const placeholder = (text: string) => <p className="text-sm text-muted-foreground">{text}</p>

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
    ],
  },
  {
    element: <RequireAgent />,
    children: [
      {
        element: <StandaloneLayout />,
        children: [
          { path: '/', element: <WorkspaceRedirect /> },
          {
            element: <RequireNoWorkspace />,
            children: [{ path: '/onboarding', element: <OnboardingPage /> }],
          },
        ],
      },
      {
        path: '/:slug',
        element: <WorkspaceRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                element: <RequireActiveWorkspace />,
                children: [
                  { index: true, element: <Navigate to="roadmap" replace /> },
                  {
                    path: 'roadmap',
                    handle: { title: 'Roadmap' } satisfies PageHandle,
                    element: placeholder("The Roadmap Board isn't built yet."),
                  },
                  {
                    path: 'install',
                    handle: { title: 'Install' } satisfies PageHandle,
                    element: <InstallPage />,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]
