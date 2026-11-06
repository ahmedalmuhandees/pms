const STORAGE_PREFIX = 'pms_field_memory:'
const MAX_VALUES = 20

function storageKey(key: string) {
  return `${STORAGE_PREFIX}${key}`
}

export function loadFieldMemory(key: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(key))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((v): v is string => typeof v === 'string')
      .map((v) => v.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

export function rememberFieldValue(key: string, value?: string | null) {
  const trimmed = (value ?? '').trim()
  if (!trimmed || !key) return
  const prev = loadFieldMemory(key).filter((v) => v.toLowerCase() !== trimmed.toLowerCase())
  const next = [trimmed, ...prev].slice(0, MAX_VALUES)
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(next))
  } catch {
    // ignore quota / private mode
  }
}

export function suggestFieldValues(key: string, query = ''): string[] {
  const all = loadFieldMemory(key)
  const q = query.trim().toLowerCase()
  if (!q) return all
  return all.filter((v) => v.toLowerCase().includes(q))
}
