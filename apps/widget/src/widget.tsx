import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { languageSchema, type RoadlyInitOptions } from '@roadly/shared'
import { createSessionClient, type SessionIdentity } from './api/session'
import { WidgetRoot } from './app/WidgetRoot'
import { LanguageContext } from './i18n/use-language'
import { WidgetSessionProvider } from './session/widget-session'
import { mountShadowRoot } from './shadow/mount'
import cssText from './index.css?inline'

let unmountWidget: (() => void) | null = null

function resolveContainer(container: RoadlyInitOptions['container']): HTMLElement | null {
  return typeof container === 'string'
    ? document.querySelector<HTMLElement>(container)
    : container
}

function resolveIdentity({ getToken, user }: RoadlyInitOptions): SessionIdentity | null {
  if (typeof getToken === 'function') {
    return { kind: 'signed', getToken }
  }

  if (user?.id && user.name && user.email) {
    return { kind: 'unsigned', contact: { externalId: user.id, name: user.name, email: user.email } }
  }

  return null
}

function init(options: RoadlyInitOptions) {
  if (unmountWidget) {
    console.error('[Roadly] init was already called; call Roadly.shutdown() first')
    return
  }

  const identity = options?.widgetKey ? resolveIdentity(options) : null
  if (!identity) {
    console.error('[Roadly] init requires widgetKey and either getToken or user { id, name, email }')
    return
  }

  const container = resolveContainer(options.container)
  if (!container) {
    console.error('[Roadly] init could not resolve the given container')
    return
  }

  const mount = mountShadowRoot(container, cssText)
  const root = createRoot(mount.mountPoint)
  const queryClient = new QueryClient()
  const session = createSessionClient(options.widgetKey, identity)
  const language = languageSchema.safeParse(options.language).data ?? 'en'

  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <LanguageContext.Provider value={language}>
          <WidgetSessionProvider widgetKey={options.widgetKey} session={session}>
            <WidgetRoot theme={options.theme ?? 'auto'} />
          </WidgetSessionProvider>
        </LanguageContext.Provider>
      </QueryClientProvider>
    </StrictMode>,
  )

  unmountWidget = () => {
    root.unmount()
    queryClient.clear()
    mount.shadowRoot.replaceChildren()
  }
}

function shutdown() {
  unmountWidget?.()
  unmountWidget = null
}

const Roadly = { init, shutdown }

declare global {
  interface Window {
    Roadly: typeof Roadly
  }
}
window.Roadly = Roadly
