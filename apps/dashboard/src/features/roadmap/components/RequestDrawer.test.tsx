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
const sso = {
  id: 'r1',
  title: 'SSO',
  description: 'SAML single sign-on.',
  category: 'Auth',
  status: 'PLANNED',
  workspaceId: acme.id,
  authorId: 'c1',
  author: { name: 'Jane Doe', email: 'jane@example.com' },
  voteCount: 4,
  createdAt: '2026-10-05T00:00:00.000Z',
}
const webhooks = {
  ...sso,
  id: 'r2',
  title: 'Webhooks',
  category: null,
  authorId: null,
  author: null,
  voteCount: 0,
}

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

function setup(routes: Parameters<typeof mockApi>[0] = {}) {
  let list = [sso, webhooks]
  const update = vi.fn((body: unknown, url: URL) => {
    const id = url.pathname.split('/').pop()
    list = list.map((request) => (request.id === id ? { ...request, ...(body as object) } : request))
    return { status: 200, body: list.find((request) => request.id === id) }
  })
  const remove = vi.fn((_: unknown, url: URL) => {
    list = list.filter((request) => request.id !== url.pathname.split('/').pop())
    return { status: 204 }
  })
  mockApi({
    'GET /auth/me': () => ({ status: 200, body: agent }),
    'GET /workspaces': () => ({ status: 200, body: [acme] }),
    'GET /feature-requests': () => ({ status: 200, body: list }),
    'PATCH /feature-requests/r1': update,
    'PATCH /feature-requests/r2': update,
    'DELETE /feature-requests/r1': remove,
    ...routes,
  })
  const user = userEvent.setup()
  renderApp('/acme/roadmap')

  return { update, remove, user }
}

async function openCard(user: ReturnType<typeof userEvent.setup>, title: string) {
  await user.click(await screen.findByRole('button', { name: title }))
  return screen.findByRole('dialog', { name: title })
}

const columnOf = (title: string) =>
  screen
    .getByRole('button', { name: title, hidden: true })
    .closest('section')
    ?.getAttribute('aria-labelledby')

test('opens a card with its votes, author and fields', async () => {
  const { user } = setup()

  const drawer = await openCard(user, 'SSO')

  expect(within(drawer).getByText('4')).toBeInTheDocument()
  expect(within(drawer).getByText('Jane Doe')).toBeInTheDocument()
  expect(within(drawer).getByRole('link', { name: 'jane@example.com' })).toHaveAttribute('href', 'mailto:jane@example.com')
  expect(within(drawer).getByLabelText('Title')).toHaveValue('SSO')
  expect(within(drawer).getByLabelText('Category')).toHaveValue('Auth')
  expect(within(drawer).getByRole('button', { name: 'Save changes' })).toBeDisabled()
})

test('says a request without an author was added by the team', async () => {
  const { user } = setup()

  const drawer = await openCard(user, 'Webhooks')

  expect(within(drawer).getByText('Added by your team')).toBeInTheDocument()
  expect(within(drawer).getByLabelText('Category')).toHaveValue('')
  expect(within(drawer).getByRole('button', { name: 'Save changes' })).toBeDisabled()
})

test('opens with Enter on a focused card instead of picking it up', async () => {
  const { user } = setup()
  ;(await screen.findByRole('button', { name: 'SSO' })).focus()

  await user.keyboard('{Enter}')

  expect(await screen.findByRole('dialog', { name: 'SSO' })).toBeInTheDocument()
  expect(screen.queryByText('Picked up SSO.')).not.toBeInTheDocument()
})

test('opens from a table row', async () => {
  const { user } = setup()
  await screen.findByRole('button', { name: 'SSO' })
  await user.click(screen.getByRole('button', { name: 'Table' }))

  await user.click(screen.getByRole('row', { name: /Webhooks/ }))

  expect(await screen.findByRole('dialog', { name: 'Webhooks' })).toBeInTheDocument()
})

test('saves only the changed fields, trimmed', async () => {
  const { update, user } = setup()
  const drawer = await openCard(user, 'SSO')

  await user.clear(within(drawer).getByLabelText('Title'))
  await user.type(within(drawer).getByLabelText('Title'), '  Single sign-on ')
  await user.click(within(drawer).getByRole('button', { name: 'Save changes' }))

  await vi.waitFor(() =>
    expect(update).toHaveBeenCalledWith({ title: 'Single sign-on' }, expect.anything()),
  )
  expect(await within(drawer).findByRole('button', { name: 'Save changes' })).toBeDisabled()
  expect(await screen.findByRole('button', { name: 'Single sign-on', hidden: true })).toBeInTheDocument()
})

test('clears the category when the field is emptied', async () => {
  const { update, user } = setup()
  const drawer = await openCard(user, 'SSO')

  await user.clear(within(drawer).getByLabelText('Category'))
  await user.click(within(drawer).getByRole('button', { name: 'Save changes' }))

  await vi.waitFor(() => expect(update).toHaveBeenCalledWith({ category: null }, expect.anything()))
})

test('closes without asking when an edit is undone', async () => {
  const { user } = setup()
  const drawer = await openCard(user, 'Webhooks')

  await user.type(within(drawer).getByLabelText('Category'), 'Growth')
  await user.clear(within(drawer).getByLabelText('Category'))
  await user.keyboard('{Escape}')

  await vi.waitFor(() => expect(screen.queryByRole('dialog', { name: 'Webhooks' })).not.toBeInTheDocument())
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
})

test('asks for a title instead of saving an empty one', async () => {
  const { update, user } = setup()
  const drawer = await openCard(user, 'SSO')

  await user.clear(within(drawer).getByLabelText('Title'))
  await user.click(within(drawer).getByRole('button', { name: 'Save changes' }))

  expect(await within(drawer).findByText('Add a title.')).toBeInTheDocument()
  expect(update).not.toHaveBeenCalled()
})

test('keeps the edits and says so when saving fails', async () => {
  const { user } = setup({ 'PATCH /feature-requests/r1': () => ({ status: 500, body: {} }) })
  const drawer = await openCard(user, 'SSO')

  await user.type(within(drawer).getByLabelText('Category'), ' SSO')
  await user.click(within(drawer).getByRole('button', { name: 'Save changes' }))

  expect(await within(drawer).findByRole('alert')).toHaveTextContent("Your changes weren't saved.")
  expect(within(drawer).getByLabelText('Category')).toHaveValue('Auth SSO')
})

test('changes the status straight away', async () => {
  const { update, user } = setup()
  const drawer = await openCard(user, 'SSO')

  await user.click(within(drawer).getByRole('combobox', { name: 'Status' }))
  await user.click(await screen.findByRole('option', { name: 'Shipped' }))

  await vi.waitFor(() => expect(update).toHaveBeenCalledWith({ status: 'SHIPPED' }, expect.anything()))
  expect(columnOf('SSO')).toBe('column-SHIPPED')
  expect(within(drawer).getByRole('combobox', { name: 'Status' })).toHaveTextContent('Shipped')
})

test('deletes the request after confirming', async () => {
  const { remove, user } = setup()
  const drawer = await openCard(user, 'SSO')

  await user.click(within(drawer).getByRole('button', { name: 'Delete request' }))
  const confirm = await screen.findByRole('alertdialog', { name: 'Delete this request?' })
  expect(confirm).toHaveTextContent('"SSO" and its 4 votes will be removed.')
  await user.click(within(confirm).getByRole('button', { name: 'Delete' }))

  expect(await screen.findByText('Deleted "SSO"')).toBeInTheDocument()
  expect(remove).toHaveBeenCalledTimes(1)
  await vi.waitFor(() => expect(screen.queryByRole('dialog', { name: 'SSO' })).not.toBeInTheDocument())
  await vi.waitFor(() =>
    expect(screen.queryByRole('button', { name: 'SSO', hidden: true })).not.toBeInTheDocument(),
  )
})

test('keeps the request when the delete is cancelled', async () => {
  const { remove, user } = setup()
  const drawer = await openCard(user, 'SSO')

  await user.click(within(drawer).getByRole('button', { name: 'Delete request' }))
  await user.click(await screen.findByRole('button', { name: 'Cancel' }))

  expect(remove).not.toHaveBeenCalled()
  expect(screen.getByRole('dialog', { name: 'SSO' })).toBeInTheDocument()
})

test('asks before closing with unsaved edits', async () => {
  const { user } = setup()
  const drawer = await openCard(user, 'SSO')
  await user.type(within(drawer).getByLabelText('Title'), '!')

  await user.keyboard('{Escape}')
  const confirm = await screen.findByRole('alertdialog', { name: 'Discard changes?' })
  await user.click(within(confirm).getByRole('button', { name: 'Keep editing' }))

  expect(screen.getByRole('dialog', { name: 'SSO' })).toBeInTheDocument()
  expect(within(drawer).getByLabelText('Title')).toHaveValue('SSO!')

  await user.keyboard('{Escape}')
  await user.click(await screen.findByRole('button', { name: 'Discard' }))

  await vi.waitFor(() => expect(screen.queryByRole('dialog', { name: 'SSO' })).not.toBeInTheDocument())
})
