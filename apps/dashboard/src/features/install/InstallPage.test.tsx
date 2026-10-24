import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockApi } from '@/test/mock-api'
import { renderApp } from '@/test/render-app'

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
  createdAt: '2026-10-17T00:00:00.000Z',
}

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

function setup() {
  mockApi({
    'GET /auth/me': () => ({ status: 200, body: agent }),
    'GET /workspaces': () => ({ status: 200, body: [acme] }),
  })
  const user = userEvent.setup()
  const router = renderApp('/acme/install')

  return { router, user }
}

test('shows a snippet that loads the widget with the workspace’s key', async () => {
  setup()

  await screen.findByRole('heading', { name: 'Snippet' })
  const snippet = screen.getByText(/Roadly\.init/)

  expect(snippet).toHaveTextContent('<script src="https://cdn.test/widget.js"></script>')
  expect(snippet).toHaveTextContent("widgetKey: 'wk_acme'")
})

test('copies the whole snippet', async () => {
  const { user } = setup()

  await user.click(await screen.findByRole('button', { name: /snippet/ }))

  const copied = await navigator.clipboard.readText()
  expect(copied).toMatch(/^<div id="roadly"><\/div>/)
  expect(copied).toContain("widgetKey: 'wk_acme'")
  expect(copied).toMatch(/<\/script>$/)
  expect(screen.getByRole('button', { name: /snippet/ })).toHaveTextContent('Copied')
})

test('links to the workspace’s roadmap', async () => {
  const { router, user } = setup()

  await screen.findByRole('heading', { name: 'Snippet' })
  await user.click(within(screen.getByRole('main')).getByRole('link', { name: 'Roadmap' }))

  expect(router.state.location.pathname).toBe('/acme/roadmap')
})
