import { StrictMode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createSessionClient, type SessionIdentity } from '../api/session'
import { WidgetRoot } from '../app/WidgetRoot'
import { WidgetSessionProvider } from '../session/widget-session'
import { contact, widgetKey } from './fixtures'

export async function openWidget(identity: SessionIdentity = { kind: 'unsigned', contact }) {
  const user = userEvent.setup()
  // Without this, a failed load retries with backoff for seconds before showing the error.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <WidgetSessionProvider widgetKey={widgetKey} session={createSessionClient(widgetKey, identity)}>
          <WidgetRoot theme="light" />
        </WidgetSessionProvider>
      </QueryClientProvider>
    </StrictMode>,
  )

  await user.click(screen.getByRole('button', { name: 'Open Roadly feedback' }))

  return user
}
