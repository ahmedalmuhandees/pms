const apiOrigin = import.meta.env.DEV
  ? ''
  : import.meta.env.VITE_API_BASE_URL || 'https://pmsaas-api.execute-iq.com'

/** يحوّل مسار wwwroot النسبي إلى رابط قابل للعرض */
export function resolveMediaUrl(path?: string | null): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) return path
  if (path.startsWith('/')) return `${apiOrigin}${path}`
  return `${apiOrigin}/${path}`
}

export function fileNameFromPath(path?: string | null): string {
  if (!path) return ''
  const parts = path.split('/')
  return parts[parts.length - 1] || path
}
