import type { FeatureRequest } from '@roadly/shared'
import { Trash2 } from 'lucide-react'
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
  const [deleteFeatureRequest, { isLoading }] = useDeleteFeatureRequestMutation()

  async function handleDelete() {
    try {
      await deleteFeatureRequest(request.id).unwrap()
      onDeleted()
      toast.success(`Deleted "${request.title}"`)
    } catch {
      toast.error(`Couldn't delete "${request.title}"`)
    }
  }

  const votes = request.voteCount === 1 ? '1 vote' : `${request.voteCount} votes`

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="self-start text-destructive hover:text-destructive" disabled={isLoading}>
          <Trash2 />
          Delete request
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this request?</AlertDialogTitle>
          <AlertDialogDescription>
            "{request.title}" and its {votes} will be removed. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
