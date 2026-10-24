import { Navigate, type RouteObject } from 'react-router'
import { AppLayout } from './components/AppLayout'
import { StandaloneLayout } from './components/StandaloneLayout'
import { GuestOnly } from './features/auth/guards/GuestOnly'
import { LoginPage } from './features/auth/pages/LoginPage'
import { RequireAgent } from './features/auth/guards/RequireAgent'
import { InstallPage } from './features/install/pages/InstallPage'
import { RoadmapPage } from './features/roadmap/pages/RoadmapPage'
import { SignupPage } from './features/auth/pages/SignupPage'
import { OnboardingPage } from './features/workspaces/pages/OnboardingPage'
import { RequireActiveWorkspace } from './features/workspaces/guards/RequireActiveWorkspace'
import { RequireNoWorkspace } from './features/workspaces/guards/RequireNoWorkspace'
import { WorkspaceRedirect } from './features/workspaces/guards/WorkspaceRedirect'
import { WorkspaceRoute } from './features/workspaces/guards/WorkspaceRoute'

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
                    element: <RoadmapPage />,
                  },
                  {
                    path: 'install',
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
