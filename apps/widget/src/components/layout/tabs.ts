import { ArrowBigUp, CircleUser, type LucideIcon } from 'lucide-react'

export type TabId = 'requests' | 'mine'

interface TabDefinition {
  id: TabId
  label: string
  title: string
  icon: LucideIcon
}

export const WIDGET_TABS: TabDefinition[] = [
  { id: 'requests', label: 'Requests', title: 'Feature requests', icon: ArrowBigUp },
  { id: 'mine', label: 'My requests', title: 'My requests', icon: CircleUser },
]

export const DEFAULT_TAB: TabId = 'requests'
