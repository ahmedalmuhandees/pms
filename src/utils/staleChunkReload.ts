const STORAGE_KEY = 'vite:stale-chunk-reload'
let reloadQueued = false

export function isStaleChunkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '')
  const name = error instanceof Error ? error.name : ''
  return (
    name === 'ChunkLoadError' ||
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('Unable to preload CSS')
  )
}

export function reloadOnStaleChunk(path?: string): void {
  if (reloadQueued) return
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // Ignore private-mode storage failures and still reload once.
  }
  reloadQueued = true
  window.location.assign(path || `${window.location.pathname}${window.location.search}`)
}

export function installStaleChunkReload(): void {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()
    reloadOnStaleChunk()
  })
}
