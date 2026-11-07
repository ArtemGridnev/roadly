import {
  widgetFeatureRequestSortSchema,
  type RequestStatus,
  type WidgetFeatureRequestSort,
} from '@roadly/shared'
import { REQUEST_STATUSES } from '../../feature-requests/constants/request-status'

export type RoadmapView = 'kanban' | 'table'

export interface RoadmapSettings {
  sort: WidgetFeatureRequestSort
  view: RoadmapView
  statusFilter: RequestStatus[]
}

const SETTING_PARAMS = ['sort', 'view', 'status']

export function hasRoadmapSettings(params: URLSearchParams): boolean {
  return SETTING_PARAMS.some((param) => params.has(param))
}

export function parseRoadmapSettings(params: URLSearchParams): RoadmapSettings {
  const sort = widgetFeatureRequestSortSchema.safeParse(params.get('sort'))
  const statuses = params.getAll('status')

  return {
    sort: sort.success ? sort.data : 'top',
    view: params.get('view') === 'table' ? 'table' : 'kanban',
    statusFilter: params.has('status')
      ? REQUEST_STATUSES.filter((status) => statuses.includes(status))
      : [...REQUEST_STATUSES],
  }
}

export function toRoadmapSearchParams({ sort, view, statusFilter }: RoadmapSettings): URLSearchParams {
  const params = new URLSearchParams({ sort, view })

  if (statusFilter.length === 0) {
    params.set('status', '')
  } else if (statusFilter.length < REQUEST_STATUSES.length) {
    statusFilter.forEach((status) => params.append('status', status))
  }

  return params
}

const storageKey = (workspaceId: string) => `roadly-roadmap-${workspaceId}`

export function readStoredRoadmapSettings(workspaceId: string): URLSearchParams {
  try {
    return new URLSearchParams(localStorage.getItem(storageKey(workspaceId)) ?? '')
  } catch {
    return new URLSearchParams()
  }
}

export function writeStoredRoadmapSettings(workspaceId: string, search: string): void {
  try {
    localStorage.setItem(storageKey(workspaceId), search)
  } catch {
    // Storage blocked: the settings still apply through the URL.
  }
}
