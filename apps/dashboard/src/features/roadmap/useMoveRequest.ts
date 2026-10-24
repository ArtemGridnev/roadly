import type { FeatureRequest, RequestStatus } from '@roadly/shared'
import { toast } from 'sonner'
import { useUpdateFeatureRequestMutation } from '../feature-requests/feature-requests-api'
import { STATUS_META } from '../feature-requests/request-status'

export function useMoveRequest() {
  const [updateFeatureRequest] = useUpdateFeatureRequestMutation()

  async function moveRequest(request: FeatureRequest, status: RequestStatus) {
    if (status === request.status) {
      return
    }

    try {
      await updateFeatureRequest({ id: request.id, changes: { status } }).unwrap()
    } catch {
      toast.error(`Couldn't move "${request.title}" to ${STATUS_META[status].label}`, {
        id: `move-${request.id}`,
      })
    }
  }

  return moveRequest
}
