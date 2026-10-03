import { installDocumentStyles } from './install-document-styles'

export interface ShadowMount {
  readonly shadowRoot: ShadowRoot
  readonly mountPoint: HTMLElement
}

export function mountShadowRoot(container: HTMLElement, css: string): ShadowMount | null {
  if (container.shadowRoot) {
    return null
  }

  installDocumentStyles(css)

  const shadowRoot = container.attachShadow({ mode: 'open' })

  const style = document.createElement('style')
  style.textContent = css
  shadowRoot.appendChild(style)

  const mountPoint = document.createElement('div')
  shadowRoot.appendChild(mountPoint)

  return { shadowRoot, mountPoint }
}
