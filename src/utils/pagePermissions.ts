/** مفاتيح صفحات السايدبار — يجب أن تطابق Backend PagePermissions */

export type PageKey =
  | 'dashboard'
  | 'complexes'
  | 'agents'
  | 'complex-builder'
  | 'horizontal-builder'
  | 'complex-map'
  | 'blocks'
  | 'buildings'
  | 'floors'
  | 'units'
  | 'customers'
  | 'employees'
  | 'residents'
  | 'resident-contracts'
  | 'resident-buildings'
  | 'technicians'
  | 'vehicles'
  | 'visitors'
  | 'users'
  | 'sales-contracts'
  | 'price-plans'
  | 'contract-clauses'
  | 'contract-designs'
  | 'installments'
  | 'reservations'
  | 'receipts'
  | 'service-settings'
  | 'monthly-services'
  | 'monthly-invoices'
  | 'electricity-invoices'
  | 'electricity-pricing'
  | 'electricity-reports'
  | 'gas-invoices'
  | 'gas-pricing'
  | 'gas-reports'
  | 'water-invoices'
  | 'water-pricing'
  | 'water-reports'
  | 'expenses'
  | 'expenses-reports'
  | 'general-reports'
  | 'audit-log'
  | 'settings'
  | 'notification-settings'

export interface PagePermissionItem {
  key: PageKey
  label: string
  path: string
}

export interface PagePermissionGroup {
  key: string
  label: string
  items: PagePermissionItem[]
}

export const PAGE_PERMISSION_GROUPS: PagePermissionGroup[] = [
  {
    key: 'dashboard',
    label: 'لوحة التحكم',
    items: [{ key: 'dashboard', label: 'لوحة التحكم', path: '/' }],
  },
  {
    key: 'structure',
    label: 'الهيكل العقاري',
    items: [
      { key: 'complexes', label: 'المجمعات', path: '/complexes' },
      { key: 'agents', label: 'مدراء المجمعات', path: '/agents' },
      { key: 'complex-builder', label: 'هيكل عمودي', path: '/complex-builder' },
      { key: 'horizontal-builder', label: 'هيكل أفقي', path: '/horizontal-builder' },
      { key: 'complex-map', label: 'خريطة المجمع', path: '/complex-map' },
      { key: 'blocks', label: 'البلوكات', path: '/blocks' },
      { key: 'buildings', label: 'المباني', path: '/buildings' },
      { key: 'floors', label: 'الطوابق', path: '/floors' },
      { key: 'units', label: 'الوحدات', path: '/units' },
    ],
  },
  {
    key: 'people',
    label: 'التشغيل',
    items: [
      { key: 'customers', label: 'العملاء', path: '/customers' },
      { key: 'employees', label: 'الموظفون', path: '/employees' },
      { key: 'residents', label: 'كل الساكنين', path: '/residents' },
      { key: 'resident-contracts', label: 'عقود الساكنين', path: '/resident-contracts' },
      { key: 'resident-buildings', label: 'بناية الساكنين', path: '/resident-buildings' },
      { key: 'technicians', label: 'الفنيون', path: '/technicians' },
      { key: 'vehicles', label: 'المركبات', path: '/vehicles' },
      { key: 'visitors', label: 'الزوار', path: '/visitors' },
      { key: 'users', label: 'المستخدمون', path: '/users' },
      { key: 'monthly-invoices', label: 'فواتير الخدمة الشهرية', path: '/monthly-invoices' },
      { key: 'electricity-invoices', label: 'فواتير الكهرباء', path: '/electricity-invoices' },
      { key: 'electricity-pricing', label: 'إعدادات تسعير الكهرباء', path: '/electricity-pricing' },
      { key: 'electricity-reports', label: 'تقارير الكهرباء', path: '/electricity-reports' },
      { key: 'gas-invoices', label: 'فواتير الغاز', path: '/gas-invoices' },
      { key: 'gas-pricing', label: 'إعدادات تسعير الغاز', path: '/gas-pricing' },
      { key: 'gas-reports', label: 'تقارير الغاز', path: '/gas-reports' },
      { key: 'water-invoices', label: 'فواتير المياه', path: '/water-invoices' },
      { key: 'water-pricing', label: 'إعدادات تسعير المياه', path: '/water-pricing' },
      { key: 'water-reports', label: 'تقارير المياه', path: '/water-reports' },
      { key: 'expenses', label: 'إضافة المصاريف', path: '/expenses' },
      { key: 'expenses-reports', label: 'تقارير المصاريف', path: '/expenses-reports' },
      { key: 'general-reports', label: 'التقارير العامة', path: '/general-reports' },
      { key: 'audit-log', label: 'سجل الحركات والأحداث', path: '/audit-log' },
      { key: 'service-settings', label: 'إعدادات الخدمات الشهرية', path: '/service-settings' },
      { key: 'monthly-services', label: 'الخدمات الشهرية', path: '/monthly-services' },
    ],
  },
  {
    key: 'sales',
    label: 'المبيعات والمالية',
    items: [
      { key: 'sales-contracts', label: 'عقود المبيعات', path: '/sales-contracts' },
      { key: 'price-plans', label: 'خطط الأسعار', path: '/price-plans' },
      { key: 'contract-clauses', label: 'بنود العقد', path: '/contract-clauses' },
      { key: 'contract-designs', label: 'تصاميم العقود', path: '/contract-designs' },
      { key: 'installments', label: 'الأقساط', path: '/installments' },
      { key: 'reservations', label: 'الحجوزات', path: '/reservations' },
      { key: 'receipts', label: 'الوصولات', path: '/receipts' },
    ],
  },
  {
    key: 'settings',
    label: 'الإعدادات',
    items: [
      { key: 'settings', label: 'واتساب', path: '/settings' },
      { key: 'notification-settings', label: 'إعدادات التنبيهات', path: '/notification-settings' },
    ],
  },
]

export const ALL_PAGE_KEYS: PageKey[] = PAGE_PERMISSION_GROUPS.flatMap((g) =>
  g.items.map((i) => i.key),
)

export const PATH_TO_PAGE_KEY: Record<string, PageKey> = Object.fromEntries(
  PAGE_PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => [i.path, i.key])),
) as Record<string, PageKey>

export function pathToPageKey(path: string): PageKey | null {
  if (path === '/' || path === '') return 'dashboard'
  const normalized = path.startsWith('/') ? path : `/${path}`
  // تفاصيل فرعية مثل /customers/:id
  if (PATH_TO_PAGE_KEY[normalized]) return PATH_TO_PAGE_KEY[normalized]
  const base = '/' + normalized.split('/').filter(Boolean)[0]
  return PATH_TO_PAGE_KEY[base] ?? null
}

export const PAGE_KEY_TO_PATH: Record<string, string> = Object.fromEntries(
  PAGE_PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => [i.key, i.path])),
)

/** أول مسار مسموح — يتجنب حلقة إعادة التوجيه إلى dashboard بدون صلاحية */
export function firstAllowedPath(allowedKeys: string[] | null | undefined): string {
  if (!allowedKeys?.length) return '/'
  if (allowedKeys.includes('dashboard')) return '/'
  for (const key of ALL_PAGE_KEYS) {
    if (allowedKeys.includes(key)) return PAGE_KEY_TO_PATH[key] || '/'
  }
  return PAGE_KEY_TO_PATH[allowedKeys[0]] || '/'
}

export function filterGroupsByAllowed(
  allowedKeys: string[] | null | undefined,
  options?: { allIfEmpty?: boolean },
): PagePermissionGroup[] {
  const all = options?.allIfEmpty !== false
  if (!allowedKeys || allowedKeys.length === 0) {
    return all ? PAGE_PERMISSION_GROUPS : []
  }
  const set = new Set(allowedKeys)
  return PAGE_PERMISSION_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => set.has(i.key)),
  })).filter((g) => g.items.length > 0)
}
