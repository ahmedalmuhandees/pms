import { UnitStatus, UnitType, MaritalStatus, ResidentStatus, MaintenanceCategory } from '@/types'

export const unitStatusOptions = [
  { value: UnitStatus.Available, label: 'متاح' },
  { value: UnitStatus.Reserved, label: 'محجوز' },
  { value: UnitStatus.Sold, label: 'مباع' },
  { value: UnitStatus.Rented, label: 'مؤجر' },
  { value: UnitStatus.UnderMaintenance, label: 'صيانة' },
]

export const unitTypeOptions = [
  { value: UnitType.Apartment, label: 'شقة' },
  { value: UnitType.Villa, label: 'فيلا' },
  { value: UnitType.Studio, label: 'استوديو' },
  { value: UnitType.Duplex, label: 'دوبلكس' },
  { value: UnitType.Shop, label: 'محل' },
  { value: UnitType.Office, label: 'مكتب' },
]

export const maritalStatusOptions = [
  { value: MaritalStatus.Single, label: 'أعزب' },
  { value: MaritalStatus.Married, label: 'متزوج' },
  { value: MaritalStatus.Divorced, label: 'مطلق' },
  { value: MaritalStatus.Widowed, label: 'أرمل' },
]

export const complexStatusOptions = [
  { value: 'Active', label: 'نشط' },
  { value: 'Inactive', label: 'متوقف' },
  { value: 'UnderConstruction', label: 'قيد الإنشاء' },
]

export const residentStatusOptions = [
  { value: ResidentStatus.Active, label: 'ساكن حالياً' },
  { value: ResidentStatus.MovedOut, label: 'غادر' },
  { value: ResidentStatus.Evicted, label: 'تم إخلاؤه' },
]

export const maintenanceCategoryOptions = [
  { value: MaintenanceCategory.Electrical, label: 'كهرباء' },
  { value: MaintenanceCategory.Plumbing, label: 'سباكة' },
  { value: MaintenanceCategory.HVAC, label: 'تكييف' },
  { value: MaintenanceCategory.Civil, label: 'مدني' },
  { value: MaintenanceCategory.Other, label: 'أخرى' },
]

export function labelOf(
  options: { value: string | number; label: string }[],
  value: string | number | null | undefined,
): string {
  return options.find((o) => o.value === value)?.label ?? (value == null || value === '' ? '—' : String(value))
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('ar-IQ')
  } catch {
    return value
  }
}

export function formatMoney(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('ar-IQ').format(value)
}

/** Build { id, label } options for PrimeVue Select */
export function asSelectOptions<T extends { id: string }>(
  items: T[],
  getLabel: (item: T) => string,
): { id: string; label: string }[] {
  return items.map((item) => ({
    id: item.id,
    label: getLabel(item) || item.id,
  }))
}

/** Translate common English API messages to Arabic */
export function translateMessage(message: string): string {
  const map: Record<string, string> = {
    'Invalid email or password.': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    'Invalid email or password': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    Unauthorized: 'غير مصرح. يرجى تسجيل الدخول مجدداً.',
    Forbidden: 'ليس لديك صلاحية لتنفيذ هذا الإجراء.',
    'Not Found': 'العنصر غير موجود.',
    'Internal Server Error': 'خطأ في الخادم. حاول لاحقاً.',
    'Network Error': 'تعذر الاتصال بالخادم.',
  }
  if (map[message]) return map[message]

  const lower = message.toLowerCase()
  for (const [en, ar] of Object.entries(map)) {
    if (lower === en.toLowerCase()) return ar
  }
  return message
}
