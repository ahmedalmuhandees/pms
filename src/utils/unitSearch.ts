/** يزيل الفواصل والرموز غير الأبجدية/الرقمية لمطابقة بحث مثل 601 مع B6-0-1 */
export function normalizeUnitSearch(value: string | null | undefined): string {
  return (value || '').toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]/gi, '')
}

/**
 * ترتيب طبيعي للأرقام/الأكواد: 1 < 2 < 10 و B1-0-1 < B1-0-2 < B1-0-10
 * يقارن الأجزاء الحرفية رقمياً عند الإمكان.
 */
export function compareNaturalCodes(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  const left = (a || '').trim()
  const right = (b || '').trim()
  if (!left && !right) return 0
  if (!left) return 1
  if (!right) return -1

  const leftParts = left.split(/([^0-9]+)/).filter(Boolean)
  const rightParts = right.split(/([^0-9]+)/).filter(Boolean)
  const n = Math.max(leftParts.length, rightParts.length)

  for (let i = 0; i < n; i++) {
    const lp = leftParts[i] ?? ''
    const rp = rightParts[i] ?? ''
    const ln = Number(lp)
    const rn = Number(rp)
    const lIsNum = lp !== '' && Number.isFinite(ln) && /^\d+$/.test(lp)
    const rIsNum = rp !== '' && Number.isFinite(rn) && /^\d+$/.test(rp)

    if (lIsNum && rIsNum) {
      if (ln !== rn) return ln - rn
      continue
    }

    const cmp = lp.localeCompare(rp, 'en', { numeric: true, sensitivity: 'base' })
    if (cmp !== 0) return cmp
  }

  return left.localeCompare(right, 'en', { numeric: true, sensitivity: 'base' })
}

/** Alias — ترتيب رقم الوحدة */
export function compareUnitNumbers(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  return compareNaturalCodes(a, b)
}

/** ترتيب رقم العقد (نصي/رقمي طبيعي) */
export function compareContractNumbers(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  return compareNaturalCodes(a, b)
}

export function unitSearchMatches(
  haystack: string | null | undefined,
  query: string | null | undefined,
): boolean {
  const q = normalizeUnitSearch(query)
  if (!q) return true
  const h = normalizeUnitSearch(haystack)
  return h.includes(q) || (haystack || '').toLowerCase().includes((query || '').trim().toLowerCase())
}
