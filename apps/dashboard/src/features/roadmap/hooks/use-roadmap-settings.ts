import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { useCurrentWorkspace } from '../../workspaces/hooks/use-current-workspace'
import {
  hasRoadmapSettings,
  parseRoadmapSettings,
  readStoredRoadmapSettings,
  toRoadmapSearchParams,
  writeStoredRoadmapSettings,
  type RoadmapSettings,
} from '../utils/roadmap-settings'

export function useRoadmapSettings() {
  const workspace = useCurrentWorkspace()
  const [searchParams, setSearchParams] = useSearchParams()
  const settings = parseRoadmapSettings(
    hasRoadmapSettings(searchParams) ? searchParams : readStoredRoadmapSettings(workspace.id),
  )
  const currentSearch = searchParams.toString()
  const search = toRoadmapSearchParams(settings).toString()

  useEffect(() => {
    writeStoredRoadmapSettings(workspace.id, search)

    if (currentSearch !== search) {
      setSearchParams(search, { replace: true })
    }
  }, [workspace.id, currentSearch, search, setSearchParams])

  function updateSettings(changes: Partial<RoadmapSettings>) {
    setSearchParams(toRoadmapSearchParams({ ...settings, ...changes }), { replace: true })
  }

  return { ...settings, updateSettings }
}
