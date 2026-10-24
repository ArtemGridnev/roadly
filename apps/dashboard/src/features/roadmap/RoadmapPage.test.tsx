import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockApi, type MockResponse } from '@/test/mock-api'
import { renderApp } from '@/test/render-app'
import { REQUEST_STATUSES } from '../feature-requests/request-status'

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
const request = (id: string, title: string, status: string, voteCount: number, createdAt: string) => ({
  id,
  title,
  description: `${title} description`,
  category: null,
  status,
  workspaceId: acme.id,
  authorId: null,
  voteCount,
  createdAt,
})
const darkMode = { ...request('r1', 'Dark mode', 'BACKLOG', 3, '2026-10-01T00:00:00.000Z'), category: 'UI' }
const csvExport = request('r2', 'CSV export', 'BACKLOG', 9, '2026-09-01T00:00:00.000Z')
const sso = request('r3', 'SSO', 'IN_PROGRESS', 5, '2026-10-05T00:00:00.000Z')

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  localStorage.clear()
})

function setup(
  listResponse: (sort: string | null) => MockResponse,
  routes: Parameters<typeof mockApi>[0] = {},
) {
  mockApi({
    'GET /auth/me': () => ({ status: 200, body: agent }),
    'GET /workspaces': () => ({ status: 200, body: [acme] }),
    'GET /feature-requests': (_, url) => listResponse(url.searchParams.get('sort')),
    ...routes,
  })
  const user = userEvent.setup()
  const router = renderApp('/acme/roadmap')

  return { router, user }
}

const column = (name: string) => screen.findByRole('region', { name })
const titlesIn = (region: HTMLElement) =>
  within(region).queryAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)

test('groups requests into a column per status', async () => {
  setup(() => ({ status: 200, body: [csvExport, sso, darkMode] }))

  const backlog = await column('Backlog')

  expect(titlesIn(backlog)).toEqual(['CSV export', 'Dark mode'])
  expect(within(backlog).getByText('2')).toBeInTheDocument()
  expect(within(backlog).getByLabelText('3 votes')).toBeInTheDocument()
  expect(within(backlog).getByText('UI')).toBeInTheDocument()
  expect(titlesIn(await column('In progress'))).toEqual(['SSO'])
  expect(within(await column('Planned')).getByText('No requests')).toBeInTheDocument()
  expect(within(await column('Shipped')).getByText('No requests')).toBeInTheDocument()
})

test('sorts by most voted, and by newest when picked', async () => {
  const { user } = setup((sort) => ({
    status: 200,
    body: sort === 'newest' ? [sso, darkMode, csvExport] : [csvExport, sso, darkMode],
  }))
  expect(titlesIn(await column('Backlog'))).toEqual(['CSV export', 'Dark mode'])

  await user.click(screen.getByRole('button', { name: /Sort: Most voted/ }))
  await user.click(screen.getByRole('menuitemradio', { name: 'Newest' }))

  expect(await screen.findByRole('button', { name: /Sort: Newest/ })).toBeInTheDocument()
  await vi.waitFor(async () => expect(titlesIn(await column('Backlog'))).toEqual(['Dark mode', 'CSV export']))
})

test('points an empty board to the install page', async () => {
  const { router, user } = setup(() => ({ status: 200, body: [] }))

  await user.click(await screen.findByRole('link', { name: 'Install the widget' }))

  expect(router.state.location.pathname).toBe('/acme/install')
})

test('retries after the requests fail to load', async () => {
  let fail = true
  const { user } = setup(() => (fail ? { status: 500, body: {} } : { status: 200, body: [sso] }))

  expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't reach Roadly")
  fail = false
  await user.click(screen.getByRole('button', { name: 'Try again' }))

  expect(titlesIn(await column('In progress'))).toEqual(['SSO'])
})

// jsdom has no layout: put the columns side by side and each card at the top of its column.
// The drag overlay sits outside the columns, so it takes the rect of the card it copies.
function layOutColumns() {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const original = !this.closest('section') && document.querySelector(`[aria-label="${this.querySelector('h3')?.textContent}"]`)
    if (original) {
      return original.getBoundingClientRect()
    }

    const column = this.closest('section[aria-labelledby^="column-"]')
    const index = REQUEST_STATUSES.indexOf(column?.getAttribute('aria-labelledby')?.slice(7) as never)
    const [left, top, width, height] =
      index === -1 ? [0, 0, 0, 0] : this === column ? [index * 300, 0, 280, 600] : [index * 300 + 12, 40, 256, 80]

    return { x: left, y: top, left, top, width, height, right: left + width, bottom: top + height, toJSON: () => ({}) }
  })
}

async function moveRight(user: ReturnType<typeof userEvent.setup>, title: string) {
  screen.getByRole('button', { name: title }).focus()
  await user.keyboard(' ')
  await user.keyboard('{ArrowRight}')
  await user.keyboard(' ')
}

test('moves a request to the next column with the keyboard', async () => {
  layOutColumns()
  const update = vi.fn((body: unknown) => ({ status: 200, body: { ...sso, ...(body as object) } }))
  const { user } = setup(() => ({ status: 200, body: [sso] }), { 'PATCH /feature-requests/r3': update })
  await column('In progress')

  await moveRight(user, 'SSO')

  await vi.waitFor(async () => expect(titlesIn(await column('Shipped'))).toEqual(['SSO']))
  expect(titlesIn(await column('In progress'))).toEqual([])
  expect(update).toHaveBeenCalledWith({ status: 'SHIPPED' }, expect.anything())
  expect(await screen.findByText('SSO moved to Shipped.')).toBeInTheDocument()
})

test('puts the request back and says so when the move fails', async () => {
  layOutColumns()
  const { user } = setup(() => ({ status: 200, body: [sso] }), {
    'PATCH /feature-requests/r3': () => ({ status: 500, body: {} }),
  })
  await column('In progress')

  await moveRight(user, 'SSO')

  expect(await screen.findByText('Couldn\'t move "SSO" to Shipped')).toBeInTheDocument()
  expect(titlesIn(await column('In progress'))).toEqual(['SSO'])
  expect(titlesIn(await column('Shipped'))).toEqual([])
})

test('leaves a request alone when it is dropped in its own column', async () => {
  layOutColumns()
  const update = vi.fn(() => ({ status: 200, body: sso }))
  const { user } = setup(() => ({ status: 200, body: [sso] }), { 'PATCH /feature-requests/r3': update })
  await column('In progress')

  screen.getByRole('button', { name: 'SSO' }).focus()
  await user.keyboard(' ')
  await user.keyboard(' ')

  expect(await screen.findByText('SSO moved to In progress.')).toBeInTheDocument()
  expect(update).not.toHaveBeenCalled()
})
