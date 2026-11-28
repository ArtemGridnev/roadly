import { screen, within } from '@testing-library/react'
import { buildRequest, createSession } from '../test/fixtures'
import { mockApi } from '../test/mock-api'
import { openWidget } from '../test/render-widget'

test("lists the contact's own requests, shipped ones included, without voting on those", async () => {
  mockApi({
    'POST /widget/session/unsigned': createSession,
    'GET /widget/feature-requests': () => ({ status: 200, body: [] }),
    'GET /widget/feature-requests/mine': () => ({
      status: 200,
      body: [
        buildRequest({ id: 'fr-1', title: 'Dark mode', status: 'SHIPPED', voteCount: 4, isMine: true }),
        buildRequest({ id: 'fr-2', title: 'CSV export', status: 'PLANNED', voteCount: 1, isMine: true }),
      ],
    }),
  })
  const user = await openWidget()

  await user.click(screen.getByRole('tab', { name: 'My requests' }))

  const shipped = (await screen.findByText('Dark mode')).closest('li')!
  const planned = screen.getByText('CSV export').closest('li')!
  expect(within(shipped).getByText('Shipped')).toBeInTheDocument()
  expect(within(shipped).getByRole('button', { name: 'Upvote, 4 votes' })).toBeDisabled()
  expect(within(planned).getByRole('button', { name: 'Upvote, 1 vote' })).toBeEnabled()
})

test('invites a first request when the contact has none', async () => {
  mockApi({
    'POST /widget/session/unsigned': createSession,
    'GET /widget/feature-requests': () => ({ status: 200, body: [] }),
    'GET /widget/feature-requests/mine': () => ({ status: 200, body: [] }),
  })
  const user = await openWidget()

  await user.click(screen.getByRole('tab', { name: 'My requests' }))

  expect(await screen.findByText("You haven't requested anything yet")).toBeInTheDocument()
})
