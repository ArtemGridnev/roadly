import { screen, waitFor } from '@testing-library/react'
import { buildRequest, createSession } from '../../test/fixtures'
import { mockApi, type MockResponse } from '../../test/mock-api'
import { openWidget } from '../../test/render-widget'

function setup(hasVoted: boolean) {
  let respond!: (response: MockResponse) => void
  const vote = vi.fn(() => new Promise<MockResponse>((resolve) => (respond = resolve)))
  mockApi({
    'POST /widget/session/unsigned': createSession,
    'GET /widget/feature-requests': () => ({
      status: 200,
      body: [buildRequest({ id: 'fr-1', title: 'Dark mode', voteCount: 2, hasVoted })],
    }),
    [`${hasVoted ? 'DELETE' : 'POST'} /widget/feature-requests/fr-1/votes`]: vote,
  })

  return { vote, respond: (response: MockResponse) => respond(response), user: openWidget() }
}

async function voteButton(count: number) {
  const button = await screen.findByRole('button', { name: `Upvote, ${count} votes` })
  await waitFor(() => expect(button).toBeEnabled())
  return button
}

test('counts a vote straight away and sends it', async () => {
  const { vote, respond, user } = setup(false)

  await (await user).click(await voteButton(2))

  expect(await screen.findByRole('button', { name: 'Upvote, 3 votes' })).toHaveAttribute('aria-pressed', 'true')
  await waitFor(() => expect(vote).toHaveBeenCalledOnce())
  respond({ status: 201 })
  expect(await screen.findByRole('button', { name: 'Upvote, 3 votes' })).toHaveAttribute('aria-pressed', 'true')
})

test('removes a vote on a second click', async () => {
  const { vote, respond, user } = setup(true)

  await (await user).click(await voteButton(2))

  expect(await screen.findByRole('button', { name: 'Upvote, 1 vote' })).toHaveAttribute('aria-pressed', 'false')
  await waitFor(() => expect(vote).toHaveBeenCalledOnce())
  respond({ status: 204 })
})

test('puts the vote back when it fails', async () => {
  const { vote, respond, user } = setup(false)

  await (await user).click(await voteButton(2))
  await screen.findByRole('button', { name: 'Upvote, 3 votes' })
  await waitFor(() => expect(vote).toHaveBeenCalledOnce())
  respond({ status: 500 })

  expect(await screen.findByRole('button', { name: 'Upvote, 2 votes' })).toHaveAttribute('aria-pressed', 'false')
})
