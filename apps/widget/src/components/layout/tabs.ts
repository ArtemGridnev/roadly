import { ArrowBigUp, CircleUser, type LucideIcon } from 'lucide-react'

export type TabId = 'requests' | 'mine'

interface TabDefinition {
  id: TabId
  icon: LucideIcon
}

export const WIDGET_TABS: TabDefinition[] = [
  { id: 'requests', icon: ArrowBigUp },
  { id: 'mine', icon: CircleUser },
]

export const DEFAULT_TAB: TabId = 'requests'
