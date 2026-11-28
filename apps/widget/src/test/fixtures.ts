import type { CreateContactInput, WidgetFeatureRequest, WidgetSession } from '@roadly/shared'
import type { MockResponse } from './mock-api'

export const widgetKey = 'wk_acme'

export const contact: CreateContactInput = {
  externalId: 'user-1',
  name: 'Jane Doe',
  email: 'jane@example.com',
}

export const session: WidgetSession = { sessionToken: 'session-1', contactId: 'contact-1' }

export const createSession = (): MockResponse => ({ status: 201, body: session })

export function buildRequest(
  fields: Pick<WidgetFeatureRequest, 'id' | 'title'> & Partial<WidgetFeatureRequest>,
): WidgetFeatureRequest {
  return {
    description: `${fields.title}, please.`,
    status: 'BACKLOG',
    workspaceId: 'ws-acme',
    voteCount: 0,
    createdAt: '2026-11-01T00:00:00.000Z',
    hasVoted: false,
    isMine: false,
    ...fields,
  }
}
