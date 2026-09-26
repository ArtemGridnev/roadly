import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { RoadlyInitOptions } from '@roadly/shared'
import App from './App.tsx'
import { WidgetSessionProvider } from './session/widget-session.tsx'
import cssText from './index.css?inline'

function init(options: RoadlyInitOptions) {
  const container =
    typeof options.container === 'string'
      ? document.querySelector<HTMLElement>(options.container)
      : options.container

  if (!container || container.shadowRoot) {
    return
  }

  const shadowRoot = container.attachShadow({ mode: 'open' })

  const style = document.createElement('style')
  style.textContent = cssText
  shadowRoot.appendChild(style)

  const mountPoint = document.createElement('div')
  shadowRoot.appendChild(mountPoint)

  const queryClient = new QueryClient()

  createRoot(mountPoint).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <WidgetSessionProvider widgetKey={options.widgetKey} user={options.user}>
          <App />
        </WidgetSessionProvider>
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
