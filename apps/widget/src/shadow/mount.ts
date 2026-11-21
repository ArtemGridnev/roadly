import { installDocumentStyles } from './install-document-styles'

export interface ShadowMount {
  readonly shadowRoot: ShadowRoot
  readonly mountPoint: HTMLElement
}

export function mountShadowRoot(container: HTMLElement, css: string): ShadowMount {
  installDocumentStyles(css)

  const shadowRoot = container.shadowRoot ?? container.attachShadow({ mode: 'open' })

  const style = document.createElement('style')
  style.textContent = css

  const mountPoint = document.createElement('div')
  shadowRoot.replaceChildren(style, mountPoint)

  return { shadowRoot, mountPoint }
}
