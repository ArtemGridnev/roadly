import type { Agent, Workspace } from '@roadly/shared'

export const agent: Agent = {
  id: 'agent-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  language: null,
  createdAt: '2026-10-12T00:00:00.000Z',
}

export function buildWorkspace(name: string, slug: string): Workspace {
  return {
    id: `ws-${slug}`,
    name,
    slug,
    widgetKey: `wk_${slug}`,
    requireSignedIdentity: false,
    createdAt: '2026-10-17T00:00:00.000Z',
  }
}

export const acme = buildWorkspace('Acme', 'acme')

export const unauthorized = () => ({ status: 401, body: { message: 'Unauthorized' } })
