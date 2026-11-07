import { screen } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'

// By keyboard: jsdom's zero-size rects make Radix close a submenu as soon as the pointer leaves its trigger.
export async function chooseSetting(user: UserEvent, setting: string, option: string) {
  await user.click(await screen.findByRole('button', { name: /^(Settings|הגדרות)$/ }))
  screen.getByRole('menuitem', { name: setting }).focus()
  await user.keyboard('{ArrowRight}')
  ;(await screen.findByRole('menuitemradio', { name: option })).focus()
  await user.keyboard('{Enter}')
}
