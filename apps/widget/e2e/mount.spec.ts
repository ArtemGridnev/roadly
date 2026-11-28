import { expect, test } from '@playwright/test'
import type { WidgetFeatureRequest } from '@roadly/shared'
import { openHostPage, unsignedUser, widgetSession } from './host-page'

const listRequests = () => ({
  status: 200,
  body: [
    {
      id: 'fr-1',
      title: 'Dark mode',
      description: 'Easier on the eyes at night.',
      status: 'PLANNED',
      workspaceId: 'ws-acme',
      voteCount: 3,
      createdAt: '2026-11-01T00:00:00.000Z',
      hasVoted: false,
      isMine: false,
    },
  ] satisfies WidgetFeatureRequest[],
})

test('renders styled inside a shadow root, with no styles crossing in either direction', async ({ page }) => {
  await openHostPage(page, {
    'POST /widget/session/unsigned': widgetSession,
    'GET /widget/feature-requests': listRequests,
  })
  await page.evaluate((user) => {
    window.Roadly.init({ container: '#widget-container', widgetKey: 'wk_acme', user })
  }, unsignedUser)

  const launcher = page.getByRole('button', { name: 'Open Roadly feedback' })
  await launcher.click()
  await expect(page.getByText('Dark mode')).toBeVisible()

  expect(await page.evaluate(() => document.querySelectorAll('button').length)).toBe(0)
  expect(await page.evaluate(() => !!document.querySelector('#widget-container')?.shadowRoot)).toBe(true)

  const closeButton = page.getByRole('button', { name: 'Close Roadly' }).last()
  await expect(closeButton).not.toHaveCSS('background-color', 'rgb(255, 0, 0)')
  await expect(closeButton).not.toHaveCSS('border-radius', '0px')

  // Tailwind's borders rely on @property rules, which only register from the document.
  await expect(page.getByRole('tabpanel')).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveCSS('border-top-style', 'solid')

  await expect(page.getByText('Host paragraph')).toBeVisible()
})

test('signs in with getToken when the host also passes a user', async ({ page }) => {
  const sessionBodies: unknown[] = []
  await openHostPage(page, {
    'POST /widget/session/signed': (request) => {
      sessionBodies.push(request.postDataJSON())
      return widgetSession()
    },
    'GET /widget/feature-requests': listRequests,
    'GET /widget/feature-requests/mine': () => ({ status: 200, body: [] }),
  })
  await page.evaluate((user) => {
    window.Roadly.init({
      container: '#widget-container',
      widgetKey: 'wk_acme',
      user,
      getToken: async () => 'host-jwt',
    })
  }, unsignedUser)

  await page.getByRole('button', { name: 'Open Roadly feedback' }).click()
  await page.getByRole('tab', { name: 'My requests' }).click()

  await expect(page.getByText("You haven't requested anything yet")).toBeVisible()
  expect(sessionBodies).toEqual([{ token: 'host-jwt' }])
})

test('ignores a second init, and mounts again after shutdown', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await openHostPage(page, {
    'POST /widget/session/unsigned': widgetSession,
    'GET /widget/feature-requests': listRequests,
  })
  const init = () =>
    page.evaluate((user) => {
      window.Roadly.init({ container: '#widget-container', widgetKey: 'wk_acme', user })
    }, unsignedUser)
  const launcher = page.getByRole('button', { name: 'Open Roadly feedback' })

  await init()
  await init()

  await expect(launcher).toHaveCount(1)
  expect(errors).toEqual(['[Roadly] init was already called; call Roadly.shutdown() first'])

  await page.evaluate(() => window.Roadly.shutdown())
  await expect(launcher).toHaveCount(0)

  await init()
  await launcher.click()
  await expect(page.getByText('Dark mode')).toBeVisible()
})
