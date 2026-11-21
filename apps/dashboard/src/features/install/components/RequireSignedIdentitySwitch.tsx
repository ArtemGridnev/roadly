import { Info } from 'lucide-react'
import { useId, useState } from 'react'
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
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { getErrorStatus } from '@/api/errors'
import { useUpdateWorkspaceIdentityMutation } from '../api/workspace-identity-api'

interface RequireSignedIdentitySwitchProps {
  required: boolean
  canRequire: boolean
}

export function RequireSignedIdentitySwitch({ required, canRequire }: RequireSignedIdentitySwitchProps) {
  const { t } = useTranslation()
  const switchId = useId()
  const hintId = useId()
  const [updateIdentity, { isLoading }] = useUpdateWorkspaceIdentityMutation()
  const [isConfirming, setIsConfirming] = useState(false)
  // Kept after the dialog closes so its copy doesn't flip while it animates out.
  const [confirmTarget, setConfirmTarget] = useState(true)

  async function update(requireSignedIdentity: boolean) {
    const result = await updateIdentity({ requireSignedIdentity })

    if (result.error) {
      toast.error(
        getErrorStatus(result.error) === 409
          ? t('install.secure.requireNotConnected')
          : t('install.secure.requireFailed'),
      )
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Switch
          id={switchId}
          checked={required}
          disabled={isLoading || (!required && !canRequire)}
          aria-describedby={hintId}
          onCheckedChange={(checked) => {
            setConfirmTarget(checked)
            setIsConfirming(true)
          }}
        />
        <Label htmlFor={switchId}>{t('install.secure.requireLabel')}</Label>
      </div>
      {required || canRequire ? (
        <p id={hintId} className="text-sm text-muted-foreground">
          {t('install.secure.requireHint')}
        </p>
      ) : (
        <Alert role="note">
          <Info aria-hidden="true" />
          <AlertDescription id={hintId}>{t('install.secure.requireDisabledHint')}</AlertDescription>
        </Alert>
      )}

      <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmTarget ? t('install.secure.requireConfirmTitle') : t('install.secure.stopRequireConfirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget
                ? t('install.secure.requireConfirmDescription')
                : t('install.secure.stopRequireConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void update(confirmTarget)}>
              {confirmTarget ? t('install.secure.requireConfirm') : t('install.secure.stopRequireConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
