import type { FeatureRequest } from '@roadly/shared'
import { ArrowBigUp } from 'lucide-react'
import { useRef, useState } from 'react'
import { Drawer } from '@/components/Drawer'
import { Separator } from '@/components/ui/separator'
import { formatRequestDate } from '@/lib/format-date'
import { DeleteRequestButton } from './DeleteRequestButton'
import { RequestForm, type RequestFormHandle } from './RequestForm'
import { RequestStatusSelect } from './RequestStatusSelect'

interface RequestDrawerProps {
  request: FeatureRequest | undefined
  onClose: () => void
}

export function RequestDrawer({ request, onClose }: RequestDrawerProps) {
  const [shown, setShown] = useState(request)
  const formRef = useRef<RequestFormHandle>(null)

  if (request && request !== shown) {
    setShown(request)
  }

  return (
    <Drawer
      open={request !== undefined}
      onClose={onClose}
      title={shown?.title ?? ''}
      description={shown ? `Created ${formatRequestDate(shown.createdAt)}` : ''}
      hasUnsavedChanges={() => formRef.current?.isDirty() ?? false}
    >
      {shown ? (
        <>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
            <dt className="text-muted-foreground">Votes</dt>
            <dd className="flex items-center gap-1 font-medium">
              <ArrowBigUp aria-hidden="true" className="size-4" />
              {shown.voteCount}
            </dd>
            <dt className="text-muted-foreground">Author</dt>
            <dd className="min-w-0">
              {shown.author ? (
                <>
                  <span className="block truncate font-medium">{shown.author.name}</span>
                  <a
                    href={`mailto:${shown.author.email}`}
                    className="block truncate text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {shown.author.email}
                  </a>
                </>
              ) : (
                <span className="text-muted-foreground">Added by your team</span>
              )}
            </dd>
          </dl>

          <RequestStatusSelect request={shown} />

          <Separator />

          <RequestForm key={shown.id} ref={formRef} request={shown} />

          <Separator />

          <DeleteRequestButton request={shown} onDeleted={onClose} />
        </>
      ) : null}
    </Drawer>
  )
}
