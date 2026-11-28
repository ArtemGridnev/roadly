import { screen, within } from '@testing-library/react'
import type { WidgetFeatureRequest } from '@roadly/shared'
import { buildRequest, createSession } from '../../test/fixtures'
import { mockApi, type MockResponse } from '../../test/mock-api'
import { openWidget } from '../../test/render-widget'

function setup({
  createSessionResponse = createSession,
  createResponse = (body: unknown): MockResponse => ({
    status: 201,
    body: buildRequest({ id: 'fr-new', ...(body as Pick<WidgetFeatureRequest, 'title'>), isMine: true }),
  }),
} = {}) {
  const mine: WidgetFeatureRequest[] = []
  const create = vi.fn((body: unknown) => {
    const response = createResponse(body)
    if (response.status === 201) mine.unshift(response.body as WidgetFeatureRequest)
    return response
  })
  mockApi({
    'POST /widget/session/unsigned': createSessionResponse,
    'GET /widget/feature-requests': () => ({ status: 200, body: [] }),
    'GET /widget/feature-requests/mine': () => ({ status: 200, body: [...mine] }),
    'POST /widget/feature-requests': (body) => create(body),
  })

  return { create }
}

async function openForm() {
  const user = await openWidget()
  await user.click(screen.getByRole('tab', { name: 'My requests' }))
  await user.click(screen.getByRole('button', { name: 'New request' }))
  return { user, form: screen.getByRole('dialog', { name: 'New request' }) }
}

test('flags empty fields without sending', async () => {
  const { create } = setup()
  const { user, form } = await openForm()

  await user.type(within(form).getByLabelText('Title'), '   ')
  await user.click(within(form).getByRole('button', { name: 'Send request' }))

  expect(within(form).getByLabelText('Title')).toHaveAccessibleDescription('Add a short title.')
  expect(within(form).getByLabelText('Description')).toHaveAccessibleDescription('Describe what you need and why.')
  expect(create).not.toHaveBeenCalled()
})

test('sends the trimmed request and shows it in My requests', async () => {
  const { create } = setup()
  const { user, form } = await openForm()

  await user.type(within(form).getByLabelText('Title'), '  CSV export  ')
  await user.type(within(form).getByLabelText('Description'), ' So I can share reports. ')
  await user.click(within(form).getByRole('button', { name: 'Send request' }))

  expect(await screen.findByText('CSV export')).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Request sent')
  expect(screen.getByRole('button', { name: 'New request' })).toHaveFocus()
  expect(create).toHaveBeenCalledWith({ title: 'CSV export', description: 'So I can share reports.' })
})

test('keeps the text and says so when sending fails', async () => {
  setup({ createResponse: () => ({ status: 500 }) })
  const { user, form } = await openForm()

  await user.type(within(form).getByLabelText('Title'), 'CSV export')
  await user.type(within(form).getByLabelText('Description'), 'So I can share reports.')
  await user.click(within(form).getByRole('button', { name: 'Send request' }))

  expect(await within(form).findByRole('alert')).toHaveTextContent("Your request wasn't sent.")
  expect(within(form).getByLabelText('Title')).toHaveValue('CSV export')
})

test("says requests can't be sent when the contact couldn't be identified", async () => {
  setup({ createSessionResponse: () => ({ status: 500 }) })
  const { form } = await openForm()

  expect(await within(form).findByRole('alert')).toHaveTextContent("We couldn't identify your account")
  expect(within(form).getByRole('button', { name: 'Send request' })).toBeDisabled()
})
