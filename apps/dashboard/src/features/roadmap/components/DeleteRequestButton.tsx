import type { FeatureRequest } from '@roadly/shared'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="self-start text-destructive hover:text-destructive" disabled={isLoading}>
          <Trash2 />
          {t('roadmap.delete.button')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('roadmap.delete.confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('roadmap.delete.confirmDescription', {
              title: request.title,
              votes: t('common.votes', { count: request.voteCount }),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete}>
            {t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
