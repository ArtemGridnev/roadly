const FONT_LINK_ID = 'roadly-widget-fonts'
const PROPERTY_STYLE_ID = 'roadly-widget-properties'

const INTER_STYLESHEET_HREF =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'

const PROPERTY_RULE_PATTERN = /@property\s+--[\w-]+\s*\{[^}]*\}/g

// @font-face and @property register document-wide; both are ignored inside a shadow root.
export function installDocumentStyles(shadowCss: string): void {
  if (!document.getElementById(FONT_LINK_ID)) {
    const link = document.createElement('link')
    link.id = FONT_LINK_ID
    link.rel = 'stylesheet'
    link.href = INTER_STYLESHEET_HREF
    document.head.appendChild(link)
  }

  if (document.getElementById(PROPERTY_STYLE_ID)) {
    return
  }

  const propertyRules = shadowCss.match(PROPERTY_RULE_PATTERN)
  if (!propertyRules) {
    return
  }

  const style = document.createElement('style')
  style.id = PROPERTY_STYLE_ID
  style.textContent = propertyRules.join('\n')
  document.head.appendChild(style)
}
