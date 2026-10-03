import {
  UnitStatus,
  UnitType,
  MaritalStatus,
  ResidentStatus,
  MaintenanceCategory,
  ReservationStatus,
  ContractStatus,
  ContractType,
  ContractPaymentType,
  PricingMode,
  PricePlanScope,
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

export const contractTypeOptions = [
  { value: ContractType.Sale, label: 'بيع' },
  { value: ContractType.Rent, label: 'إيجار' },
]

export const contractPaymentTypeOptions = [
  { value: ContractPaymentType.Cash, label: 'كاش' },
  { value: ContractPaymentType.RealEstateBank, label: 'مصرف عقاري' },
]

export const pricingModeOptions = [
  { value: PricingMode.Manual, label: 'يدوي' },
  { value: PricingMode.System, label: 'من خطة الأسعار' },
]

export const pricePlanScopeOptions = [
  { value: PricePlanScope.Block, label: 'بلوك' },
  { value: PricePlanScope.Building, label: 'بناية' },
  { value: PricePlanScope.Unit, label: 'وحدة' },
]

export const logoPositionOptions = [
  { value: 'right', label: 'يمين' },
  { value: 'left', label: 'يسار' },
  { value: 'center', label: 'وسط' },
]

export const contractFontOptions = [
  { value: 'Cairo', label: 'Cairo' },
  { value: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic' },
  { value: 'Tajawal', label: 'Tajawal' },
  { value: 'Almarai', label: 'Almarai' },
]

export const installmentStatusOptions = [
  { value: InstallmentStatus.Pending, label: 'غير مدفوع' },
  { value: InstallmentStatus.Paid, label: 'مدفوع' },
  { value: InstallmentStatus.Partial, label: 'مدفوع جزئياً' },
  { value: InstallmentStatus.Overdue, label: 'متأخر' },
  { value: InstallmentStatus.Cancelled, label: 'ملغى' },
]

/** Pending قبل تاريخ الاستحقاق = غير مدفوع، وعند/بعد التاريخ = مستحقة */
export function installmentStatusLabel(
  status: number | null | undefined,
  dueDate?: string | null,
): string {
  if (status === InstallmentStatus.Pending && dueDate) {
    const due = new Date(dueDate)
    if (!Number.isNaN(due.getTime())) {
      const today = new Date()
      due.setHours(0, 0, 0, 0)
      today.setHours(0, 0, 0, 0)
      return due > today ? 'غير مدفوع' : 'مستحقة'
    }
  }
  return labelOf(installmentStatusOptions, status)
}

function dayStart(value: string | Date): Date | null {
  const d = value instanceof Date ? new Date(value) : new Date(value)
  if (Number.isNaN(d.getTime())) return null
  d.setHours(0, 0, 0, 0)
  return d
}

export function isInstallmentPaid(status: number | null | undefined): boolean {
  return status === InstallmentStatus.Paid || status === InstallmentStatus.Cancelled
}

/** مستحقة: وصل تاريخها ولم تُدفع بالكامل */
export function isInstallmentDue(status: number | null | undefined, dueDate?: string | null): boolean {
  if (isInstallmentPaid(status)) return false
  if (status === InstallmentStatus.Overdue) return true
  const due = dueDate ? dayStart(dueDate) : null
  const today = dayStart(new Date())
  if (!due || !today) return status === InstallmentStatus.Pending || status === InstallmentStatus.Partial
  return due <= today
}

/** غير مدفوعة (قبل الاستحقاق) */
export function isInstallmentNotYetDue(
  status: number | null | undefined,
  dueDate?: string | null,
): boolean {
  if (isInstallmentPaid(status)) return false
  if (status !== InstallmentStatus.Pending && status !== InstallmentStatus.Partial) return false
  const due = dueDate ? dayStart(dueDate) : null
  const today = dayStart(new Date())
  if (!due || !today) return false
  return due > today
}

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
    return new Date(value).toLocaleDateString('en-GB')
  } catch {
    return value
  }
}

export function formatMoney(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US').format(value)
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
