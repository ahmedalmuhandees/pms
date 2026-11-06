export type TableSortMode = 'latest' | 'sequential' | 'reverse'

export const TABLE_SORT_OPTIONS: { label: string; value: TableSortMode }[] = [
  { label: 'آخر إضافة', value: 'latest' },
  { label: 'ترتيب بالتسلسل', value: 'sequential' },
  { label: 'ترتيب عكسي', value: 'reverse' },
]

export const TABLE_SORT_CYCLE: TableSortMode[] = ['latest', 'sequential', 'reverse']

export function nextTableSortMode(mode: TableSortMode): TableSortMode {
  const i = TABLE_SORT_CYCLE.indexOf(mode)
  return TABLE_SORT_CYCLE[(i + 1) % TABLE_SORT_CYCLE.length]
}

export function tableSortModeLabel(mode: TableSortMode): string {
  return TABLE_SORT_OPTIONS.find((o) => o.value === mode)?.label || 'آخر إضافة'
}

/** ترتيب أيقونة PrimeVue: 1=تصاعدي، -1=تنازلي */
export function tableSortOrder(mode: TableSortMode): 1 | -1 {
  return mode === 'sequential' ? 1 : -1
}

/** يحوّل وضع الواجهة إلى SortBy / SortDirection للـ API */
export function tableSortToParams(mode: TableSortMode): {
  SortBy: string
  SortDirection: string
} {
  switch (mode) {
    case 'sequential':
      // رقم الوحدة/التسلسل التصاعدي (B1-0-1 ثم B1-0-2…)
      return { SortBy: 'UnitNumber', SortDirection: 'asc' }
    case 'reverse':
      return { SortBy: 'UnitNumber', SortDirection: 'desc' }
    case 'latest':
    default:
      return { SortBy: 'CreatedAt', SortDirection: 'desc' }
  }
}

export function paramsToTableSort(sortBy?: string | null, sortDirection?: string | null): TableSortMode {
  const by = (sortBy || 'CreatedAt').toLowerCase()
  const dir = (sortDirection || 'desc').toLowerCase()
  if (by === 'unitnumber' && dir === 'asc') return 'sequential'
  if (by === 'unitnumber' && dir === 'desc') return 'reverse'
  if (by === 'createdat' && dir === 'asc') return 'sequential'
  return 'latest'
}

/** فرز محلي للقوائم التي لا تمر عبر usePagedList */
export function sortByTableMode<T extends object>(
  items: T[],
  mode: TableSortMode,
  dateKeys: string[] = ['createdAt', 'CreatedAt', 'dueDate', 'expenseDate', 'paymentDate'],
): T[] {
  const key =
    dateKeys.find((k) => items.some((row) => (row as Record<string, unknown>)[k] != null)) ||
    dateKeys[0]
  const dir = mode === 'sequential' ? 1 : -1
  return items.slice().sort((a, b) => {
    const av = (a as Record<string, unknown>)[key]
    const bv = (b as Record<string, unknown>)[key]
    const at = av != null && av !== '' ? new Date(String(av)).getTime() : NaN
    const bt = bv != null && bv !== '' ? new Date(String(bv)).getTime() : NaN
    if (!Number.isNaN(at) && !Number.isNaN(bt)) {
      if (at === bt) return 0
      return at < bt ? -dir : dir
    }
    const as = av == null ? '' : String(av)
    const bs = bv == null ? '' : String(bv)
    return as.localeCompare(bs, 'ar') * dir
  })
}
