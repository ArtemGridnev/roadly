const widgetUrl = import.meta.env.VITE_WIDGET_URL

if (!widgetUrl) {
  throw new Error(
    'VITE_WIDGET_URL is not set. Add it to apps/dashboard/.env (see .env.example).',
  )
}

function snippet(widgetKey: string, identityLine: string) {
  return `<div id="roadly"></div>
<script src="${widgetUrl}"></script>
<script>
  Roadly.init({
    container: '#roadly',
    widgetKey: '${widgetKey}',
    ${identityLine}
    // 'light', 'dark', or 'auto' to follow your user's system setting
    theme: 'auto',
    // 'en' or 'he'. Hebrew also lays the widget out right to left
    language: 'en',
  })
</script>`
}

export function installSnippet(widgetKey: string) {
  return snippet(
    widgetKey,
    'user: { id: currentUser.id, name: currentUser.name, email: currentUser.email },',
  )
}

export function signedInstallSnippet(widgetKey: string) {
  return snippet(
    widgetKey,
    "getToken: () => fetch('/roadly-token').then((response) => response.text()),",
  )
}

export const tokenLibraryInstallCommand = 'npm install jsonwebtoken'

export const tokenRouteSnippet = `import jwt from 'jsonwebtoken'

app.get('/roadly-token', requireSignedIn, (req, res) => {
  const token = jwt.sign(
    { user_id: String(req.user.id), name: req.user.name, email: req.user.email },
    process.env.ROADLY_IDENTITY_SECRET,
    { algorithm: 'HS256', expiresIn: '1h' },
  )

  res.type('text/plain').send(token)
})`
