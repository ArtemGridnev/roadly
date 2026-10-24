const widgetUrl = import.meta.env.VITE_WIDGET_URL

if (!widgetUrl) {
  throw new Error(
    'VITE_WIDGET_URL is not set. Add it to apps/dashboard/.env (see .env.example).',
  )
}

export function installSnippet(widgetKey: string) {
  return `<div id="roadly"></div>
<script src="${widgetUrl}"></script>
<script>
  Roadly.init({
    container: '#roadly',
    widgetKey: '${widgetKey}',
    // Replace with your signed-in user
    user: { id: currentUser.id, name: currentUser.name, email: currentUser.email },
    theme: 'auto',
  })
</script>`
}
