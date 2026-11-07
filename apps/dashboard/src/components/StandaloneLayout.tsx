import type { ReactNode } from 'react'
import { Outlet } from 'react-router'
import { SettingsMenu } from './SettingsMenu'
import { RoadlyLogo } from './RoadlyLogo'

export function StandaloneLayout({ children }: { children?: ReactNode }) {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center gap-6 p-4">
      <div className="absolute end-4 top-4">
        <SettingsMenu />
      </div>
      <RoadlyLogo />
      {children ?? <Outlet />}
    </main>
  )
}
