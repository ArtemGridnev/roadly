import type { FeatureRequest, RequestStatus } from '@roadly/shared'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useUpdateFeatureRequestMutation } from '../../feature-requests/api/feature-requests-api'

export function useMoveRequest() {
  const { t } = useTranslation()
  const [updateFeatureRequest] = useUpdateFeatureRequestMutation()

  async function moveRequest(request: FeatureRequest, status: RequestStatus) {
    if (status === request.status) {
      return
    }

    try {
      await updateFeatureRequest({ id: request.id, changes: { status } }).unwrap()
    } catch {
      toast.error(t('roadmap.moveFailed', { title: request.title, status: t(`status.${status}`) }), {
        id: `move-${request.id}`,
      })
    }
  }

  return moveRequest
}
