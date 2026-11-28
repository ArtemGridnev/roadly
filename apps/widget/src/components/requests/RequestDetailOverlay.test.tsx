import { screen, within } from '@testing-library/react'
import { buildRequest, createSession } from '../../test/fixtures'
import { mockApi } from '../../test/mock-api'
import { openWidget } from '../../test/render-widget'

test('opens a request and returns to it on Escape', async () => {
  mockApi({
    'POST /widget/session/unsigned': createSession,
    'GET /widget/feature-requests': () => ({
      status: 200,
      body: [buildRequest({ id: 'fr-1', title: 'Dark mode', description: 'Easier on the eyes at night.' })],
    }),
  })
  const user = await openWidget()

  const title = await screen.findByRole('button', { name: 'Dark mode' })
  await user.click(title)

  const details = screen.getByRole('dialog', { name: 'Request' })
  expect(within(details).getByRole('heading', { name: 'Dark mode' })).toBeInTheDocument()
  expect(within(details).getByText('Easier on the eyes at night.')).toBeInTheDocument()

  await user.keyboard('{Escape}')

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(title).toHaveFocus()
})
