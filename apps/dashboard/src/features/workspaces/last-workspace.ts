const STORAGE_KEY = 'roadly-last-workspace'

export function readLastWorkspace(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function writeLastWorkspace(slug: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, slug)
  } catch {
    // Storage blocked: `/` falls back to the first workspace.
  }
}
