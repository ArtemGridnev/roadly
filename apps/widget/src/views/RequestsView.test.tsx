import { screen, waitFor } from '@testing-library/react'
import { buildRequest, createSession } from '../test/fixtures'
import { mockApi, type MockResponse } from '../test/mock-api'
import { openWidget } from '../test/render-widget'

function setup(listRequests: (url: URL) => MockResponse) {
  mockApi({
    'POST /widget/session/unsigned': createSession,
    'GET /widget/feature-requests': (_body, url) => listRequests(url),
  })

  return openWidget()
}

const requestTitles = () => screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)

test('lists requests by most voted, and by newest when picked', async () => {
  const older = buildRequest({ id: 'fr-1', title: 'Dark mode', voteCount: 5 })
  const newer = buildRequest({ id: 'fr-2', title: 'CSV export', voteCount: 1 })
  const user = await setup((url) => ({
    status: 200,
    body: url.searchParams.get('sort') === 'newest' ? [newer, older] : [older, newer],
  }))

  expect(await screen.findByText('Dark mode')).toBeInTheDocument()
  expect(requestTitles()).toEqual(['Dark mode', 'CSV export'])

  await user.click(screen.getByRole('button', { name: 'Newest' }))

  expect(screen.getByRole('button', { name: 'Newest' })).toHaveAttribute('aria-pressed', 'true')
  await waitFor(() => expect(requestTitles()).toEqual(['CSV export', 'Dark mode']))
})

test('invites the first request when there are none', async () => {
  await setup(() => ({ status: 200, body: [] }))

  expect(await screen.findByText('No feature requests yet')).toBeInTheDocument()
})

test('retries after the requests fail to load', async () => {
  const responses: MockResponse[] = [
    { status: 500 },
    { status: 200, body: [buildRequest({ id: 'fr-1', title: 'Dark mode' })] },
  ]
  const user = await setup(() => responses.shift()!)

  await user.click(await screen.findByRole('button', { name: 'Try again' }))

  expect(await screen.findByText('Dark mode')).toBeInTheDocument()
})
