import { ShieldAlert } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { LoadError } from '@/components/LoadError'
import { PageContent } from '@/components/PageContent'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useCurrentWorkspace } from '../../workspaces/hooks/use-current-workspace'
import { useGetWorkspaceIdentityQuery } from '../api/workspace-identity-api'
import { CodeBlock } from '../components/CodeBlock'
import { IdentitySecretButton } from '../components/IdentitySecretButton'
import { RequireSignedIdentitySwitch } from '../components/RequireSignedIdentitySwitch'
import { StepStatus } from '../components/StepStatus'
import {
  installSnippet,
  signedInstallSnippet,
  tokenLibraryInstallCommand,
  tokenRouteSnippet,
} from '../utils/install-snippet'

const code = <code className="font-mono text-foreground" />

export function InstallPage() {
  const { t } = useTranslation()
  const workspace = useCurrentWorkspace()
  const { data: identity, isError, refetch } = useGetWorkspaceIdentityQuery(undefined, { refetchOnFocus: true })

  return (
    <PageContent title={t('install.title')}>
      <div className="flex max-w-2xl flex-col gap-8">
        <p className="text-sm text-muted-foreground">
          {t('install.intro')}
        </p>

        {isError ? <LoadError onRetry={() => void refetch()} /> : null}

        <section aria-labelledby="connect" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 id="connect" className="text-base font-semibold">
              {t('install.connect.title')}
            </h2>
            {identity ? (
              <StepStatus
                done={identity.widgetConnected}
                doneText={t('install.connect.connected')}
                waitingText={t('install.connect.waiting')}
              />
            ) : null}
          </div>

          <h3 className="mt-2 text-sm font-semibold">{t('install.connect.snippetTitle')}</h3>
          <p className="text-sm text-muted-foreground">
            <Trans t={t} i18nKey="install.connect.snippetStep" components={{ code }} />
          </p>
          <CodeBlock
            code={installSnippet(workspace.widgetKey)}
            copyLabel={t('install.snippetCopyLabel')}
            language="markup"
          />
          <p className="text-sm text-muted-foreground">
            {t('install.keyNote')}
          </p>

          <h3 className="mt-2 text-sm font-semibold">{t('install.connect.checkTitle')}</h3>
          <p className="text-sm text-muted-foreground">
            <Trans
              t={t}
              i18nKey="install.connect.checkStep"
              components={{
                a: <Link to={`/${workspace.slug}/roadmap`} className="font-medium text-primary hover:underline" />,
              }}
            />
          </p>
        </section>

        <Separator />

        <section aria-labelledby="secure" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 id="secure" className="text-base font-semibold">
              {t('install.secure.title')}
            </h2>
            {identity ? (
              <StepStatus
                done={identity.signedIdentityConnected}
                doneText={t('install.secure.connected')}
                waitingText={t('install.secure.waiting')}
              />
            ) : null}
          </div>
          <Alert variant="warning" role="note">
            <ShieldAlert aria-hidden="true" />
            <AlertDescription>{t('install.secure.intro')}</AlertDescription>
          </Alert>

          <h3 className="mt-2 text-sm font-semibold">{t('install.secure.secretTitle')}</h3>
          <p className="text-sm text-muted-foreground">
            <Trans t={t} i18nKey="install.secure.secretNote" components={{ code }} />
          </p>
          {identity ? <IdentitySecretButton hasSecret={identity.hasSecret} /> : null}

          <h3 className="mt-2 text-sm font-semibold">{t('install.secure.serverTitle')}</h3>
          <p className="text-sm text-muted-foreground">
            <Trans t={t} i18nKey="install.secure.serverIntro" components={{ code }} />
          </p>
          <p className="text-sm text-muted-foreground">
            {t('install.secure.installStep')}
          </p>
          <CodeBlock code={tokenLibraryInstallCommand} copyLabel={t('install.secure.installCopyLabel')} />
          <p className="text-sm text-muted-foreground">
            <Trans t={t} i18nKey="install.secure.serverStep" components={{ code }} />
          </p>
          <CodeBlock code={tokenRouteSnippet} copyLabel={t('install.secure.serverCopyLabel')} language="javascript" />

          <h3 className="mt-2 text-sm font-semibold">{t('install.secure.clientTitle')}</h3>
          <p className="text-sm text-muted-foreground">
            <Trans t={t} i18nKey="install.secure.clientStep" components={{ code }} />
          </p>
          <CodeBlock
            code={signedInstallSnippet(workspace.widgetKey)}
            copyLabel={t('install.secure.clientCopyLabel')}
            language="markup"
          />

          <h3 className="mt-2 text-sm font-semibold">{t('install.secure.enforceTitle')}</h3>
          {identity ? (
            <RequireSignedIdentitySwitch
              required={identity.requireSignedIdentity}
              canRequire={identity.signedIdentityConnected}
            />
          ) : null}
        </section>
      </div>
    </PageContent>
  )
}
