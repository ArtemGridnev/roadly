import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { PageContent } from '@/components/PageContent'
import { useCurrentWorkspace } from '../../workspaces/hooks/use-current-workspace'
import { CopyButton } from '../components/CopyButton'
import { installSnippet } from '../utils/install-snippet'

export function InstallPage() {
  const { t } = useTranslation()
  const workspace = useCurrentWorkspace()
  const snippet = installSnippet(workspace.widgetKey)

  return (
    <PageContent title={t('install.title')}>
      <div className="flex max-w-2xl flex-col gap-6">
        <p className="text-sm text-muted-foreground">
          {t('install.intro')}
        </p>

        <section aria-labelledby="snippet" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="snippet" className="text-base font-semibold">
              {t('install.snippet')}
            </h2>
            <CopyButton value={snippet} label={t('install.snippetCopyLabel')} />
          </div>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>{t('install.step1')}</li>
            <li>
              <Trans
                t={t}
                i18nKey="install.step2"
                components={{ code: <code className="font-mono text-foreground" /> }}
              />
            </li>
            <li>
              <Trans
                t={t}
                i18nKey="install.step3"
                components={{
                  a: <Link to={`/${workspace.slug}/roadmap`} className="font-medium text-primary hover:underline" />,
                }}
              />
            </li>
          </ol>
          <pre className="overflow-x-auto rounded-lg border bg-muted p-4 font-mono text-xs leading-relaxed">
            <code>{snippet}</code>
          </pre>
          <p className="text-sm text-muted-foreground">
            {t('install.keyNote')}
          </p>
        </section>
      </div>
    </PageContent>
  )
}
