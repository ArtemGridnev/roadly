import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import type { RoadlyInitOptions } from '@roadly/shared'
import App from './App.tsx'
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

  createRoot(mountPoint).render(
    <StrictMode>
      <App />
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
