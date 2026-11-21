import { KeyRound, RefreshCw } from 'lucide-react'
import { useState } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useRotateIdentitySecretMutation } from '../api/workspace-identity-api'
import { CodeBlock } from './CodeBlock'

interface IdentitySecretButtonProps {
  hasSecret: boolean
}

export function IdentitySecretButton({ hasSecret }: IdentitySecretButtonProps) {
  const { t } = useTranslation()
  const [rotateSecret, { isLoading }] = useRotateIdentitySecretMutation()
  const [secret, setSecret] = useState<string | null>(null)

  async function handleRotate() {
    try {
      setSecret((await rotateSecret().unwrap()).secret)
    } catch {
      toast.error(t('install.secure.secretFailed'))
    }
  }

  return (
    <>
      {hasSecret ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="self-start" disabled={isLoading}>
              <RefreshCw />
              {t('install.secure.rotate')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('install.secure.rotateConfirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{t('install.secure.rotateConfirmDescription')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleRotate}>{t('install.secure.rotateConfirm')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Button className="self-start" disabled={isLoading} onClick={handleRotate}>
          <KeyRound />
          {t('install.secure.generate')}
        </Button>
      )}

      <Dialog open={secret !== null} onOpenChange={(open) => !open && setSecret(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('install.secure.secretDialogTitle')}</DialogTitle>
            <DialogDescription>{t('install.secure.secretDialogDescription')}</DialogDescription>
          </DialogHeader>
          {secret ? <CodeBlock code={secret} copyLabel={t('install.secure.secretCopyLabel')} /> : null}
          <DialogFooter>
            <Button onClick={() => setSecret(null)}>{t('install.secure.done')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
