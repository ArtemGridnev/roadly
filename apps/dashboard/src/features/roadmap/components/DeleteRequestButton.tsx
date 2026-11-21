import type { FeatureRequest } from '@roadly/shared'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { useDeleteFeatureRequestMutation } from '../../feature-requests/api/feature-requests-api'

interface DeleteRequestButtonProps {
  request: FeatureRequest
  onDeleted: () => void
}

export function DeleteRequestButton({ request, onDeleted }: DeleteRequestButtonProps) {
  const { t } = useTranslation()
  const [deleteFeatureRequest, { isLoading }] = useDeleteFeatureRequestMutation()

  async function handleDelete() {
    try {
      await deleteFeatureRequest(request.id).unwrap()
      onDeleted()
      toast.success(t('roadmap.delete.deleted', { title: request.title }))
    } catch {
      toast.error(t('roadmap.delete.failed', { title: request.title }))
    }
  }

  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline" className="self-start text-destructive hover:text-destructive" disabled={isLoading}>
          <Trash2 />
          {t('roadmap.delete.button')}
        </Button>
      }
      title={t('roadmap.delete.confirmTitle')}
      description={t('roadmap.delete.confirmDescription', {
        title: request.title,
        votes: t('common.votes', { count: request.voteCount }),
      })}
      confirmLabel={t('common.delete')}
      variant="destructive"
      onConfirm={handleDelete}
    />
  )
}
