import { Link } from 'react-router'
import { PageContent } from '@/components/PageContent'
import { useCurrentWorkspace } from '../workspaces/current-workspace'
import { CopyButton } from './CopyButton'
import { installSnippet } from './install-snippet'

export function InstallPage() {
  const workspace = useCurrentWorkspace()
  const snippet = installSnippet(workspace.widgetKey)

  return (
    <PageContent title="Install">
      <div className="flex max-w-2xl flex-col gap-6">
        <p className="text-sm text-muted-foreground">
          Add the widget to your app so your users can request and vote on features.
        </p>

        <section aria-labelledby="snippet" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="snippet" className="text-base font-semibold">
              Snippet
            </h2>
            <CopyButton value={snippet} label="snippet" />
          </div>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Paste the snippet into your app where the widget should load.</li>
            <li>
              Replace <code className="font-mono text-foreground">currentUser</code> with your
              signed-in user. Their requests and votes are saved under that id.
            </li>
            <li>
              Open the{' '}
              <Link to={`/${workspace.slug}/roadmap`} className="font-medium text-primary hover:underline">
                Roadmap
              </Link>{' '}
              to see requests come in.
            </li>
          </ol>
          <pre className="overflow-x-auto rounded-lg border bg-muted p-4 font-mono text-xs leading-relaxed">
            <code>{snippet}</code>
          </pre>
          <p className="text-sm text-muted-foreground">
            The widget key in the snippet is public, so it's safe in your front end.
          </p>
        </section>
      </div>
    </PageContent>
  )
}
