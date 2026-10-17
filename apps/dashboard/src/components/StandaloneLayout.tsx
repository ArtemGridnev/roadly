import { Outlet } from 'react-router'

export function StandaloneLayout() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Outlet />
    </main>
  )
}
