import { execSync } from 'node:child_process'
import { API_URL, BUNDLE_DIR } from './host-page'

export default function buildWidget() {
  execSync(`vite build --outDir ${BUNDLE_DIR} --emptyOutDir --logLevel warn`, {
    env: { ...process.env, VITE_API_URL: API_URL },
    stdio: 'inherit',
  })
}
