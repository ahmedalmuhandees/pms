import {
  UnitStatus,
  UnitType,
  MaritalStatus,
  ResidentStatus,
  MaintenanceCategory,
  ReservationStatus,
  ContractStatus,
  InstallmentStatus,
  PaymentMethod,
  InvoiceStatus,
  InvoiceType,
  ComplexLayoutType,
  UnitUi,
} from '@/types'

export const unitStatusOptions = [
  { value: UnitStatus.Available, label: 'متاح' },
  { value: UnitStatus.Reserved, label: 'محجوز' },
  { value: UnitStatus.Sold, label: 'مباع' },
  { value: UnitStatus.Rented, label: 'مؤجر' },
  { value: UnitStatus.Maintenance, label: 'صيانة' },
]

export const unitTypeOptions = [
  { value: UnitType.Apartment, label: 'شقة' },
  { value: UnitType.Villa, label: 'فيلا' },
  { value: UnitType.Office, label: 'مكتب' },
  { value: UnitType.Shop, label: 'محل' },
  { value: UnitType.Warehouse, label: 'مخزن' },
  { value: UnitType.Other, label: 'أخرى' },
]

export const unitUiOptions = [
  { value: UnitUi.MiddleFront, label: 'وسط أمامي' },
  { value: UnitUi.MiddleBack, label: 'وسط خلفي' },
  { value: UnitUi.CornerFrontRight, label: 'زاوية أمامية يمين' },
  { value: UnitUi.CornerFrontLeft, label: 'زاوية أمامية يسار' },
  { value: UnitUi.CornerBackRight, label: 'زاوية خلفية يمين' },
  { value: UnitUi.CornerBackLeft, label: 'زاوية خلفية يسار' },
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

export const complexLayoutTypeOptions = [
  { value: ComplexLayoutType.Horizontal, label: 'أفقي' },
  { value: ComplexLayoutType.Vertical, label: 'عمودي' },
  { value: ComplexLayoutType.HorizontalVertical, label: 'أفقي - عمودي' },
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

export const reservationStatusOptions = [
  { value: ReservationStatus.Pending, label: 'قيد الانتظار' },
  { value: ReservationStatus.Confirmed, label: 'مؤكد' },
  { value: ReservationStatus.Expired, label: 'منتهي' },
  { value: ReservationStatus.Cancelled, label: 'ملغى' },
  { value: ReservationStatus.Converted, label: 'محوّل لعقد' },
]

export const contractStatusOptions = [
  { value: ContractStatus.Draft, label: 'مسودة' },
  { value: ContractStatus.Active, label: 'ساري' },
  { value: ContractStatus.Completed, label: 'مكتمل' },
  { value: ContractStatus.Cancelled, label: 'ملغى' },
  { value: ContractStatus.Suspended, label: 'موقوف' },
]

export const installmentStatusOptions = [
  { value: InstallmentStatus.Pending, label: 'مستحق' },
  { value: InstallmentStatus.Paid, label: 'مدفوع' },
  { value: InstallmentStatus.Partial, label: 'مدفوع جزئياً' },
  { value: InstallmentStatus.Overdue, label: 'متأخر' },
  { value: InstallmentStatus.Cancelled, label: 'ملغى' },
]

export const paymentMethodOptions = [
  { value: PaymentMethod.Cash, label: 'نقداً' },
  { value: PaymentMethod.BankTransfer, label: 'تحويل بنكي' },
  { value: PaymentMethod.Cheque, label: 'شيك' },
  { value: PaymentMethod.Card, label: 'بطاقة' },
  { value: PaymentMethod.Online, label: 'إلكتروني' },
]

export const invoiceStatusOptions = [
  { value: InvoiceStatus.Draft, label: 'مسودة' },
  { value: InvoiceStatus.Issued, label: 'صادرة' },
  { value: InvoiceStatus.Paid, label: 'مدفوعة' },
  { value: InvoiceStatus.Cancelled, label: 'ملغاة' },
]

export const invoiceTypeOptions = [
  { value: InvoiceType.Sales, label: 'مبيعات' },
  { value: InvoiceType.Service, label: 'خدمة' },
  { value: InvoiceType.Installment, label: 'قسط' },
  { value: InvoiceType.Other, label: 'أخرى' },
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
