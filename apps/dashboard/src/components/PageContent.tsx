import type { ReactNode } from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface PageContentProps {
  title: string
  actions?: ReactNode
  className?: string
  children: ReactNode
}

export function PageContent({ title, actions, className, children }: PageContentProps) {
  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:px-6">
        <SidebarTrigger aria-label="Open menu" className="-ml-1 md:hidden" />
        <h1 className="text-xl font-semibold">{title}</h1>
        {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
      </header>
      <div className={cn('min-w-0 flex-1 p-4 md:p-6', className)}>{children}</div>
    </>
  )
}
