import { screen } from '@testing-library/react'
import { buildRequest } from '../test/fixtures'
import { mockApi } from '../test/mock-api'
import { openWidget } from '../test/render-widget'

function mockApiWithSessions(sessionRoute: string) {
  let issued = 0
  const createSession = vi.fn((_body: unknown) => {
    issued += 1
    return { status: 201, body: { sessionToken: `session-${issued}`, contactId: 'contact-1' } }
  })
  const listMine = vi.fn((_body: unknown, _url: URL, headers: Headers) =>
    headers.get('authorization') === 'Bearer session-2'
      ? { status: 200, body: [buildRequest({ id: 'fr-1', title: 'Dark mode', isMine: true })] }
      : { status: 401 },
  )
  mockApi({
    [`POST ${sessionRoute}`]: (body) => createSession(body),
    'GET /widget/feature-requests': () => ({ status: 200, body: [] }),
    'GET /widget/feature-requests/mine': listMine,
  })

  return { createSession, listMine }
}

test('gets a new session once and retries when the session has expired', async () => {
  const { createSession, listMine } = mockApiWithSessions('/widget/session/unsigned')
  const user = await openWidget()

  await user.click(screen.getByRole('tab', { name: 'My requests' }))

  expect(await screen.findByText('Dark mode')).toBeInTheDocument()
  expect(createSession).toHaveBeenCalledTimes(2)
  expect(listMine).toHaveBeenCalledTimes(2)
})

test('signs in with a fresh host token every time the session is renewed', async () => {
  const { createSession } = mockApiWithSessions('/widget/session/signed')
  const tokens = ['host-jwt-1', 'host-jwt-2']
  const getToken = vi.fn(async () => tokens.shift()!)
  const user = await openWidget({ kind: 'signed', getToken })

  await user.click(screen.getByRole('tab', { name: 'My requests' }))

  expect(await screen.findByText('Dark mode')).toBeInTheDocument()
  expect(createSession.mock.calls).toEqual([[{ token: 'host-jwt-1' }], [{ token: 'host-jwt-2' }]])
})
