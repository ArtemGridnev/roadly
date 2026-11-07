import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { languageSchema, type RoadlyInitOptions } from '@roadly/shared'
import { WidgetRoot } from './app/WidgetRoot'
import { LanguageContext } from './i18n/use-language'
import { WidgetSessionProvider } from './session/widget-session'
import { mountShadowRoot } from './shadow/mount'
import cssText from './index.css?inline'

function resolveContainer(container: RoadlyInitOptions['container']): HTMLElement | null {
  return typeof container === 'string'
    ? document.querySelector<HTMLElement>(container)
    : container
}

function isValidOptions(options: RoadlyInitOptions): boolean {
  return Boolean(options?.widgetKey && options.user?.id && options.user.name && options.user.email)
}

function init(options: RoadlyInitOptions) {
  if (!isValidOptions(options)) {
    console.error('[Roadly] init requires widgetKey and user { id, name, email }')
    return
  }

  const container = resolveContainer(options.container)
  if (!container) {
    console.error('[Roadly] init could not resolve the given container')
    return
  }

  const mount = mountShadowRoot(container, cssText)
  if (!mount) {
    return
  }

  const queryClient = new QueryClient()
  const language = languageSchema.safeParse(options.language).data ?? 'en'

  createRoot(mount.mountPoint).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <LanguageContext.Provider value={language}>
          <WidgetSessionProvider widgetKey={options.widgetKey} user={options.user}>
            <WidgetRoot theme={options.theme ?? 'auto'} />
          </WidgetSessionProvider>
        </LanguageContext.Provider>
      </QueryClientProvider>
    </StrictMode>,
  )
}

const Roadly = { init }

declare global {
  interface Window {
    Roadly: typeof Roadly
  }
}
window.Roadly = Roadly
