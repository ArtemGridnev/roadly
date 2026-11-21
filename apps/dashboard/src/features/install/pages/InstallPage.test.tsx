import type { WorkspaceIdentity } from '@roadly/shared'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockApi } from '@/test/mock-api'
import { renderApp } from '@/test/render-app'
import { tokenRouteSnippet } from '../utils/install-snippet'

const agent = {
  id: 'agent-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  createdAt: '2026-10-12T00:00:00.000Z',
}
const acme = {
  id: 'ws-acme',
  name: 'Acme',
  slug: 'acme',
  widgetKey: 'wk_acme',
  requireSignedIdentity: false,
  createdAt: '2026-10-17T00:00:00.000Z',
}
const notSetUp: WorkspaceIdentity = {
  widgetConnected: false,
  signedIdentityConnected: false,
  hasSecret: false,
  requireSignedIdentity: false,
}

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

function setup(initial: Partial<WorkspaceIdentity> = {}, routes: Parameters<typeof mockApi>[0] = {}) {
  let identity = { ...notSetUp, ...initial }
  const rotate = vi.fn(() => {
    identity = { ...identity, hasSecret: true, signedIdentityConnected: false }
    return { status: 201, body: { secret: 'sk_new_secret' } }
  })
  const update = vi.fn((body: unknown) => {
    identity = { ...identity, ...(body as Partial<WorkspaceIdentity>) }
    return { status: 200, body: identity }
  })
  mockApi({
    'GET /auth/me': () => ({ status: 200, body: agent }),
    'GET /workspaces': () => ({ status: 200, body: [acme] }),
    'GET /workspace-identity': () => ({ status: 200, body: identity }),
    'POST /workspace-identity/secret': rotate,
    'PATCH /workspace-identity': update,
    ...routes,
  })
  const user = userEvent.setup()
  const router = renderApp('/acme/install')

  return { router, user, rotate, update }
}

const section = async (name: RegExp) => {
  const heading = await screen.findByRole('heading', { name, level: 2 })
  return heading.closest('section') as HTMLElement
}

const codeBlocks = (container: HTMLElement) =>
  [...container.querySelectorAll('pre code')].map((code) => code.textContent ?? '')

test('shows a snippet that loads the widget with the workspace’s key', async () => {
  setup()

  const [snippet] = codeBlocks(await section(/Connect/))

  expect(snippet).toContain('<script src="https://cdn.test/widget.js"></script>')
  expect(snippet).toContain("widgetKey: 'wk_acme'")
  expect(snippet).toContain('user: {')
})

test('explains theme and language inside the snippet', async () => {
  setup()

  const [snippet] = codeBlocks(await section(/Connect/))

  expect(snippet).toMatch(/\/\/ 'light', 'dark', or 'auto'.*\n\s*theme: 'auto',/)
  expect(snippet).toMatch(/\/\/ 'en' or 'he'.*\n\s*language: 'en',/)
})

test('highlights the code', async () => {
  setup()

  const snippet = (await section(/Connect/)).querySelector('pre code') as HTMLElement

  expect(within(snippet).getByText("'wk_acme'")).toHaveClass('text-green-700')
})

test('copies the whole snippet', async () => {
  const { user } = setup()

  await user.click(await screen.findByRole('button', { name: /^Copy ?snippet$/ }))

  const copied = await navigator.clipboard.readText()
  expect(copied).toMatch(/^<div id="roadly"><\/div>/)
  expect(copied).toContain("widgetKey: 'wk_acme'")
  expect(copied).toMatch(/<\/script>$/)
  expect(screen.getByRole('button', { name: /^Copied ?snippet$/ })).toBeInTheDocument()
})

test('links to the workspace’s roadmap', async () => {
  const { router, user } = setup()

  await user.click(within(await section(/Connect/)).getByRole('link', { name: 'Roadmap' }))

  expect(router.state.location.pathname).toBe('/acme/roadmap')
})

test('tags each step with whether it’s connected', async () => {
  setup({ widgetConnected: true })

  expect(await within(await section(/Connect/)).findByRole('status')).toHaveTextContent('Connected')
  expect(within(await section(/Secure/)).getByRole('status')).toHaveTextContent('Not signed yet')
})

test('shows the server steps and the signed snippet with getToken instead of user', async () => {
  setup()

  const secure = await section(/Secure/)
  const [install, route, signed] = codeBlocks(secure)

  expect(within(secure).getByText(/any language and any JWT library works/)).toBeInTheDocument()
  expect(install).toBe('npm install jsonwebtoken')
  expect(within(secure).getByRole('button', { name: /^Copy ?install command$/ })).toBeInTheDocument()
  expect(route).toContain("{ algorithm: 'HS256', expiresIn: '1h' }")
  expect(route).toBe(tokenRouteSnippet)
  expect(signed).toContain('getToken: () =>')
  expect(signed).not.toContain('user: {')
})

test('shows a new secret once, without asking first', async () => {
  const { user, rotate } = setup()

  await user.click(await screen.findByRole('button', { name: 'Generate secret' }))

  const dialog = await screen.findByRole('dialog', { name: 'Your identity secret' })
  expect(within(dialog).getByText('sk_new_secret')).toBeInTheDocument()
  expect(rotate).toHaveBeenCalledTimes(1)

  await user.click(within(dialog).getByRole('button', { name: 'Done' }))

  expect(screen.queryByText('sk_new_secret')).not.toBeInTheDocument()
  expect(await screen.findByRole('button', { name: 'Rotate secret' })).toBeInTheDocument()
})

test('asks before rotating an existing secret', async () => {
  const { user, rotate } = setup({ hasSecret: true })

  await user.click(await screen.findByRole('button', { name: 'Rotate secret' }))
  const confirm = await screen.findByRole('alertdialog', { name: 'Rotate the secret?' })
  await user.click(within(confirm).getByRole('button', { name: 'Cancel' }))

  expect(rotate).not.toHaveBeenCalled()

  await user.click(screen.getByRole('button', { name: 'Rotate secret' }))
  await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Rotate' }))

  expect(await screen.findByText('sk_new_secret')).toBeInTheDocument()
  expect(rotate).toHaveBeenCalledTimes(1)
})

test('can’t require signed identity until it has worked', async () => {
  setup({ hasSecret: true })

  const toggle = await screen.findByRole('switch', { name: 'Require signed identity' })

  expect(toggle).toBeDisabled()
  expect(toggle).toHaveAccessibleDescription(/once a user has opened the widget/)
  expect(within(await section(/Secure/)).getAllByRole('note').map((note) => note.textContent)).toEqual([
    expect.stringContaining('anyone who knows a user'),
    expect.stringContaining('once a user has opened the widget'),
  ])
})

test('requires signed identity after confirming', async () => {
  const { user, update } = setup({ hasSecret: true, signedIdentityConnected: true })

  const toggle = await screen.findByRole('switch', { name: 'Require signed identity' })
  expect(within(await section(/Secure/)).getAllByRole('note')).toHaveLength(1)
  await user.click(toggle)
  await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Require' }))

  expect(update).toHaveBeenCalledWith({ requireSignedIdentity: true }, expect.anything())
  expect(await screen.findByRole('switch', { name: 'Require signed identity', checked: true })).toBeInTheDocument()
})

test('stops requiring signed identity after confirming', async () => {
  const { user, update } = setup({ hasSecret: true, signedIdentityConnected: true, requireSignedIdentity: true })

  await user.click(await screen.findByRole('switch', { name: 'Require signed identity', checked: true }))
  const dialog = await screen.findByRole('alertdialog', { name: 'Stop requiring signed identity?' })
  expect(update).not.toHaveBeenCalled()
  await user.click(within(dialog).getByRole('button', { name: 'Stop requiring' }))

  expect(update).toHaveBeenCalledWith({ requireSignedIdentity: false }, expect.anything())
  expect(await screen.findByRole('switch', { name: 'Require signed identity', checked: false })).toBeInTheDocument()
})

test('keeps requiring signed identity when stopping is cancelled', async () => {
  const { user, update } = setup({ hasSecret: true, signedIdentityConnected: true, requireSignedIdentity: true })

  await user.click(await screen.findByRole('switch', { name: 'Require signed identity', checked: true }))
  await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Cancel' }))

  expect(update).not.toHaveBeenCalled()
  expect(screen.getByRole('switch', { name: 'Require signed identity', checked: true })).toBeInTheDocument()
})

test('says why requiring failed when the secret changed meanwhile', async () => {
  const { user } = setup(
    { hasSecret: true, signedIdentityConnected: true },
    { 'PATCH /workspace-identity': () => ({ status: 409 }) },
  )

  await user.click(await screen.findByRole('switch', { name: 'Require signed identity' }))
  await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Require' }))

  expect(await screen.findByText('Signed identity has to work with the current secret first.')).toBeInTheDocument()
})
