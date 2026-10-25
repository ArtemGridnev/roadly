import type { Workspace } from '@roadly/shared'
import { useOutletContext } from 'react-router'

export function useCurrentWorkspace() {
  return useOutletContext<Workspace>()
}
