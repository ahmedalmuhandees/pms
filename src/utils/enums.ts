import {
  UnitStatus,
  UnitType,
  MaritalStatus,
  EducationLevel,
  ResidentStatus,
  OccupancyType,
  UnitResidentPhase,
  FamilyRelation,
  MaintenanceCategory,
  ReservationStatus,
  ContractStatus,
  ContractType,
  ContractPaymentType,
  PaymentScheduleSource,
  PricingMode,
  PricePlanScope,
  PricePlanPricingType,
  InstallmentStatus,
  PaymentMethod,
  InvoiceStatus,
  InvoiceType,
  ComplexLayoutType,
  UnitUi,
  ServiceTypeName,
  ServiceBillingMode,
  MeterReadingSource,
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
  { value: UnitUi.CornerFrontRight, label: 'طرفي يمين أمامي' },
  { value: UnitUi.CornerFrontLeft, label: 'طرفي يسار أمامي' },
  { value: UnitUi.CornerBackRight, label: 'طرفي يمين خلفي' },
  { value: UnitUi.CornerBackLeft, label: 'طرفي يسار خلفي' },
  { value: UnitUi.MiddleFront, label: 'وسطي أمامي' },
  { value: UnitUi.MiddleBack, label: 'وسطي خلفي' },
]

export const maritalStatusOptions = [
  { value: MaritalStatus.None, label: 'لا يوجد' },
  { value: MaritalStatus.Single, label: 'أعزب' },
  { value: MaritalStatus.Married, label: 'متزوج' },
  { value: MaritalStatus.Divorced, label: 'مطلق' },
  { value: MaritalStatus.Widowed, label: 'أرمل' },
]

export const educationLevelOptions = [
  { value: EducationLevel.NoCertificate, label: 'دون شهادة دراسية' },
  { value: EducationLevel.Primary, label: 'الشهادة الابتدائية' },
  { value: EducationLevel.Intermediate, label: 'الشهادة المتوسطة' },
  { value: EducationLevel.Preparatory, label: 'الشهادة الإعدادية' },
  { value: EducationLevel.Diploma, label: 'شهادة الدبلوم' },
  { value: EducationLevel.Bachelor, label: 'شهادة البكالوريوس' },
  { value: EducationLevel.HigherDiploma, label: 'شهادة الدبلوم العالي' },
  { value: EducationLevel.Master, label: 'شهادة الماجستير' },
  { value: EducationLevel.Doctorate, label: 'شهادة الدكتوراه' },
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

export const serviceTypeNameOptions = [
  { value: ServiceTypeName.Electricity, label: 'كهرباء' },
  { value: ServiceTypeName.Water, label: 'مياه' },
  { value: ServiceTypeName.Internet, label: 'إنترنت' },
  { value: ServiceTypeName.Gas, label: 'غاز' },
  { value: ServiceTypeName.Security, label: 'حراسة' },
  { value: ServiceTypeName.Cleaning, label: 'نظافة' },
  { value: ServiceTypeName.Landscape, label: 'حدائق' },
  { value: ServiceTypeName.Elevator, label: 'صيانة المصاعد' },
  { value: ServiceTypeName.CorridorLighting, label: 'إنارة الممرات' },
  { value: ServiceTypeName.Other, label: 'أخرى' },
]

export const serviceBillingModeOptions = [
  { value: ServiceBillingMode.Fixed, label: 'ثابتة' },
  { value: ServiceBillingMode.Metered, label: 'حسب العداد' },
]

export const meterReadingSourceOptions = [
  { value: MeterReadingSource.Manual, label: 'يدوي (Manual)' },
  { value: MeterReadingSource.Api, label: 'تلقائي (API)' },
]

export const monthOptions = [
  { value: 1, label: 'يناير' },
  { value: 2, label: 'فبراير' },
  { value: 3, label: 'مارس' },
  { value: 4, label: 'أبريل' },
  { value: 5, label: 'مايو' },
  { value: 6, label: 'يونيو' },
  { value: 7, label: 'يوليو' },
  { value: 8, label: 'أغسطس' },
  { value: 9, label: 'سبتمبر' },
  { value: 10, label: 'أكتوبر' },
  { value: 11, label: 'نوفمبر' },
  { value: 12, label: 'ديسمبر' },
]

export const residentStatusOptions = [
  { value: ResidentStatus.Active, label: 'ساكن حالياً' },
  { value: ResidentStatus.MovedOut, label: 'غادر' },
  { value: ResidentStatus.Evicted, label: 'تم إخلاؤه' },
]

export const occupancyTypeOptions = [
  { value: OccupancyType.Owner, label: 'مالك' },
  { value: OccupancyType.Tenant, label: 'مستأجر' },
]

export const occupancyFormTypeOptions = [
  { value: OccupancyType.Owner, label: 'سكن مباشر' },
  { value: OccupancyType.Tenant, label: 'مستأجر' },
]

export const unitResidentPhaseOptions = [
  { value: UnitResidentPhase.Available, label: 'متاح' },
  { value: UnitResidentPhase.KeyHandedOver, label: 'تسليم مفتاح' },
  { value: UnitResidentPhase.Occupied, label: 'ساكن' },
]

export const familyRelationOptions = [
  { value: FamilyRelation.Spouse, label: 'زوج/زوجة' },
  { value: FamilyRelation.Parent, label: 'أب/أم' },
  { value: FamilyRelation.Sibling, label: 'أخ/أخت' },
  { value: FamilyRelation.Child, label: 'ابن/ابنة' },
  { value: FamilyRelation.Other, label: 'أخرى' },
]

export const maintenanceCategoryOptions = [
  { value: MaintenanceCategory.Electrical, label: 'كهرباء' },
  { value: MaintenanceCategory.Plumbing, label: 'سباكة' },
  { value: MaintenanceCategory.HVAC, label: 'تكييف' },
  { value: MaintenanceCategory.Civil, label: 'مدني' },
  { value: MaintenanceCategory.Other, label: 'أخرى' },
]

export const reservationStatusOptions = [
  { value: ReservationStatus.Pending, label: 'غير مؤكد' },
  { value: ReservationStatus.Confirmed, label: 'مؤكد' },
  { value: ReservationStatus.Cancelled, label: 'إلغاء الحجز' },
  { value: ReservationStatus.Expired, label: 'منتهي' },
  { value: ReservationStatus.Converted, label: 'محوّل لعقد' },
]

export const salesCommissionSourceOptions = [
  { value: 1, label: 'من العقود' },
  { value: 2, label: 'من الحجوزات' },
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
  { value: ContractPaymentType.CashInstallments, label: 'كاش الأقساط' },
  { value: ContractPaymentType.RealEstateBank, label: 'مصرف عقاري' },
]

export const pricingModeOptions = [
  { value: PricingMode.Manual, label: 'يدوي' },
  { value: PricingMode.System, label: 'من خطة الأسعار' },
  { value: PricingMode.CustomSchedule, label: 'تغيير اماكن الدفعات' },
]

export const paymentScheduleSourceOptions = [
  {
    value: PaymentScheduleSource.Auto,
    label: 'تلقائي — حسب السنوات والأشهر',
  },
  {
    value: PaymentScheduleSource.Manual,
    label: 'يدوي — تعيين الدفعات بالتفاصيل',
  },
]

export const paymentScheduleKindOptions = [
  { value: 0, label: 'دفعة / قسط' },
  { value: 1, label: 'استلام' },
  { value: 2, label: 'مقدمة' },
]

export const pricePlanScopeOptions = [
  { value: PricePlanScope.Block, label: 'بلوك' },
  { value: PricePlanScope.Building, label: 'بناية' },
  { value: PricePlanScope.Unit, label: 'وحدة' },
]

export const pricePlanPricingTypeOptions = [
  { value: PricePlanPricingType.Amount, label: 'رقمي' },
  { value: PricePlanPricingType.Percentage, label: 'نسبة' },
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

export function installmentOrdinalLabel(index: number): string {
  const map: Record<number, string> = {
    1: 'الأولى',
    2: 'الثانية',
    3: 'الثالثة',
    4: 'الرابعة',
    5: 'الخامسة',
    6: 'السادسة',
    7: 'السابعة',
    8: 'الثامنة',
    9: 'التاسعة',
    10: 'العاشرة',
    11: 'الحادية عشرة',
    12: 'الثانية عشرة',
  }
  return `الدفعة ${map[index] ?? String(index)}`
}

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
  { value: PaymentMethod.Bank, label: 'إيداع بنكي' },
  { value: PaymentMethod.Transfer, label: 'تحويل بنكي' },
  { value: PaymentMethod.Cheque, label: 'شيك' },
  { value: PaymentMethod.Card, label: 'بطاقة' },
]

/** طرق سداد فواتير الخدمات الشهرية في بروفايل الساكن */
export const serviceBillPaymentOptions = [
  { value: PaymentMethod.Cash, label: 'كاش' },
  { value: PaymentMethod.Card, label: 'ماستر' },
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
    'Subscription expired. Please contact the administrator.':
      'انتهى الاشتراك. يرجى التواصل مع مدير النظام.',
    'Subscription has not started yet. Please contact the administrator.':
      'لم يبدأ الاشتراك بعد. يرجى التواصل مع مدير النظام.',
    'Password must be at least 8 characters and include letters and numbers.':
      'كلمة السر يجب أن تكون 8 أحرف على الأقل وتحتوي حروفاً وأرقاماً.',
    'Email is already in use.': 'البريد الإلكتروني مستخدم مسبقاً.',
    'Complex not found.': 'المجمع غير موجود.',
    'Agent not found.': 'مدير المجمع غير موجود.',
    'Name is required.': 'الاسم مطلوب.',
    'Complex is required.': 'المجمع مطلوب.',
    'Email is required.': 'البريد الإلكتروني مطلوب.',
    'Subscription end date must be on or after the start date.':
      'تاريخ انتهاء الاشتراك يجب أن يكون بعد أو يساوي تاريخ البداية.',
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
