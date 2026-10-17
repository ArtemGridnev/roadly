import type { ReactNode } from 'react'
import { Outlet } from 'react-router'
import { RoadlyLogo } from './RoadlyLogo'

export function StandaloneLayout({ children }: { children?: ReactNode }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-4">
      <RoadlyLogo />
      {children ?? <Outlet />}
    </main>
  )
}
