import { useContext, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { PageActionsContext } from './page-actions-context'

export function PageActions({ children }: { children: ReactNode }) {
  const container = useContext(PageActionsContext)

  return container ? createPortal(children, container) : null
}
