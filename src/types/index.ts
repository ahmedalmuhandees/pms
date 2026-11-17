export interface ApiResponse<T> {
  success: boolean
  message: string | null
  data: T
}

export interface PagedResult<T> {
  items: T[] | null
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface PaginationParams {
  Page?: number
  PageSize?: number
  Search?: string
  SortBy?: string
  SortDirection?: string
}

export interface LoginRequest {
  email: string
  password: string
  complexId?: string | null
  complexSlug?: string | null
}

export interface ResidentLoginRequest {
  phone: string
  code: string
  complexId?: string | null
  complexSlug?: string | null
}

export interface UserInfo {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  role: string | null
  roleName?: string | null
  complexId: string | null
  isSuperAdmin: boolean
  pages?: string[] | null
  authKind?: 'staff' | 'resident' | string | null
  residentId?: string | null
  customerId?: string | null
  phone?: string | null
  unitNumber?: string | null
  unitId?: string | null
  complexName?: string | null
}

export interface LoginResponse {
  token: string | null
  expiresAt: string
  user: UserInfo
}

export interface Statistics {
  complexesCount: number
  blocksCount: number
  buildingsCount: number
  floorsCount: number
  unitsCount: number
  usersCount: number
  employeesCount: number
  customersCount: number
  residentsCount: number
  vehiclesCount: number
  visitorsCount: number
}

export const ComplexLayoutType = {
  Horizontal: 1,
  Vertical: 2,
  HorizontalVertical: 3,
} as const
export type ComplexLayoutType = (typeof ComplexLayoutType)[keyof typeof ComplexLayoutType]

export interface Complex {
  id: string
  name: string | null
  nameAr: string | null
  address: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  developer: string | null
  openingDate: string | null
  status: string | null
  layoutType: ComplexLayoutType | null
  portalSlug?: string | null
  primaryColor?: string | null
  logoUrl?: string | null
  loginBackgroundUrl?: string | null
  createdAt: string
}

export interface CreateComplexDto {
  name?: string | null
  nameAr?: string | null
  address?: string | null
  city?: string | null
  latitude?: number | null
  longitude?: number | null
  developer?: string | null
  openingDate?: string | null
  status?: string | null
  layoutType?: ComplexLayoutType | null
  portalSlug?: string | null
  primaryColor?: string | null
}

export type UpdateComplexDto = CreateComplexDto

export interface Block {
  id: string
  name: string | null
  description: string | null
  complexId: string
  createdAt: string
}

export interface CreateBlockDto {
  name?: string | null
  description?: string | null
  complexId: string
}

export type UpdateBlockDto = CreateBlockDto

export interface Building {
  id: string
  name: string | null
  description: string | null
  blockId: string
  createdAt: string
}

export interface CreateBuildingDto {
  name?: string | null
  description?: string | null
  blockId: string
}

export type UpdateBuildingDto = CreateBuildingDto

export interface Floor {
  id: string
  floorNumber: number
  buildingId: string
  createdAt: string
}

export interface CreateFloorDto {
  floorNumber: number
  buildingId: string
}

export type UpdateFloorDto = CreateFloorDto

export const UnitStatus = {
  Available: 1,
  Reserved: 2,
  Sold: 3,
  Rented: 4,
  Maintenance: 5,
} as const
export type UnitStatus = (typeof UnitStatus)[keyof typeof UnitStatus]

export const UnitType = {
  Apartment: 1,
  Villa: 2,
  Office: 3,
  Shop: 4,
  Warehouse: 5,
  Other: 6,
} as const
export type UnitType = (typeof UnitType)[keyof typeof UnitType]

export const UnitUi = {
  MiddleFront: 1,
  MiddleBack: 2,
  CornerFrontRight: 3,
  CornerFrontLeft: 4,
  CornerBackRight: 5,
  CornerBackLeft: 6,
} as const
export type UnitUi = (typeof UnitUi)[keyof typeof UnitUi]

export const MaritalStatus = {
  None: 0,
  Single: 1,
  Married: 2,
  Divorced: 3,
  Widowed: 4,
} as const
export type MaritalStatus = (typeof MaritalStatus)[keyof typeof MaritalStatus]

export const EducationLevel = {
  NoCertificate: 0,
  Primary: 1,
  Intermediate: 2,
  Preparatory: 3,
  Diploma: 4,
  Bachelor: 5,
  HigherDiploma: 6,
  Master: 7,
  Doctorate: 8,
} as const
export type EducationLevel = (typeof EducationLevel)[keyof typeof EducationLevel]

export interface Unit {
  id: string
  unitNumber: string | null
  unitType: UnitType
  area: number
  bedrooms: number
  bathrooms: number
  parkingCount: number
  gardenArea: number
  roofArea: number
  direction: string | null
  floorLevel: number
  status: UnitStatus
  price: number
  cost: number
  notes: string | null
  unitUi: UnitUi | null
  floorId: string
  complexId: string
  createdAt: string
}

export interface CreateUnitDto {
  unitNumber?: string | null
  unitType: UnitType
  area: number
  bedrooms: number
  bathrooms: number
  parkingCount: number
  gardenArea: number
  roofArea: number
  direction?: string | null
  floorLevel: number
  status: UnitStatus
  price: number
  cost: number
  notes?: string | null
  unitUi?: UnitUi | null
  floorId: string
  complexId: string
}

export type UpdateUnitDto = CreateUnitDto

export interface Customer {
  id: string
  firstName: string | null
  lastName: string | null
  nationalID: string | null
  passport: string | null
  birthDate: string | null
  phone: string | null
  email: string | null
  address: string | null
  occupation: string | null
  employer: string | null
  monthlyIncome: number | null
  maritalStatus: MaritalStatus
  educationLevel?: EducationLevel | null
  notes?: string | null
  complexId: string
  createdAt: string
}

export interface CreateCustomerDto {
  firstName?: string | null
  lastName?: string | null
  nationalID?: string | null
  passport?: string | null
  birthDate?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  occupation?: string | null
  employer?: string | null
  monthlyIncome?: number | null
  maritalStatus: MaritalStatus
  educationLevel?: EducationLevel | null
  notes?: string | null
  complexId: string
}

export type UpdateCustomerDto = CreateCustomerDto

export interface User {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  address: string | null
  complexId: string | null
  rolesId: string | null
  roleName: string | null
  createdAt: string
}

export interface CreateUserDto {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  password?: string | null
  phone?: string | null
  address?: string | null
  complexId?: string | null
  rolesId?: string | null
}

export type UpdateUserDto = CreateUserDto

export interface Agent {
  id: string
  name: string
  complexId: string
  complexName: string | null
  subscriptionStartDate: string
  subscriptionEndDate: string
  email: string
  phone: string | null
  address: string | null
  notes: string | null
  userId: string
  isSubscriptionActive: boolean
  createdAt: string
  roleName?: string | null
  pageKeys?: string[] | null
}

export interface CreateAgentDto {
  name: string
  complexId: string
  subscriptionStartDate: string
  subscriptionEndDate: string
  email: string
  password: string
  phone?: string | null
  address?: string | null
  notes?: string | null
  roleName?: string | null
  pageKeys?: string[] | null
}

export interface UpdateAgentDto {
  name: string
  complexId: string
  subscriptionStartDate: string
  subscriptionEndDate: string
  email: string
  password?: string | null
  phone?: string | null
  address?: string | null
  notes?: string | null
  roleName?: string | null
  pageKeys?: string[] | null
}

export const ResidentStatus = {
  Active: 1,
  MovedOut: 2,
  Evicted: 3,
} as const
export type ResidentStatus = (typeof ResidentStatus)[keyof typeof ResidentStatus]

export const OccupancyType = {
  Owner: 1,
  Tenant: 2,
} as const
export type OccupancyType = (typeof OccupancyType)[keyof typeof OccupancyType]

export const UnitResidentPhase = {
  Available: 1,
  KeyHandedOver: 2,
  Occupied: 3,
} as const
export type UnitResidentPhase = (typeof UnitResidentPhase)[keyof typeof UnitResidentPhase]

export const FamilyRelation = {
  Spouse: 1,
  Parent: 2,
  Sibling: 3,
  Child: 4,
  Other: 5,
} as const
export type FamilyRelation = (typeof FamilyRelation)[keyof typeof FamilyRelation]

export const MaintenanceCategory = {
  Electrical: 1,
  Plumbing: 2,
  HVAC: 3,
  Civil: 4,
  Other: 5,
} as const
export type MaintenanceCategory = (typeof MaintenanceCategory)[keyof typeof MaintenanceCategory]

export interface Employee {
  id: string
  name: string | null
  department: string | null
  position: string | null
  phone: string | null
  email: string | null
  username: string | null
  complexId: string
  userId?: string | null
  roleName?: string | null
  pageKeys?: string[] | null
  hasLogin?: boolean
  createdAt: string
}

export interface CreateEmployeeDto {
  name?: string | null
  department?: string | null
  position?: string | null
  phone?: string | null
  email?: string | null
  username?: string | null
  password?: string | null
  complexId: string
  roleName?: string | null
  pageKeys?: string[] | null
}

export type UpdateEmployeeDto = CreateEmployeeDto

export interface Resident {
  id: string
  moveInDate: string
  moveOutDate: string | null
  status: ResidentStatus
  occupancyType: OccupancyType
  customerId: string
  customerName?: string | null
  unitId: string
  unitNumber?: string | null
  complexId: string
  createdAt: string
  hasLoginCode?: boolean
}

export interface CreateResidentDto {
  moveInDate: string
  moveOutDate?: string | null
  status: ResidentStatus
  occupancyType: OccupancyType
  customerId: string
  unitId: string
  complexId: string
}

export type UpdateResidentDto = CreateResidentDto

export interface ResidentStats {
  total: number
  owners: number
  tenants: number
  movedOut: number
  evicted: number
}

export interface ResidentContractUnit {
  unitId: string
  unitNumber: string
  area: number
  complexId: string
  buildingId?: string | null
  buildingName?: string | null
  blockId?: string | null
  blockName?: string | null
  phase: UnitResidentPhase
  hasHandover: boolean
  hasOccupancy: boolean
  handoverId?: string | null
  occupancyId?: string | null
  customerId?: string | null
  customerName?: string | null
  residentId?: string | null
}

export interface KeyHandoverDto {
  id?: string
  unitId?: string
  complexId?: string
  customerId?: string | null
  recipientName?: string | null
  recipientNationalId?: string | null
  recipientPhone?: string | null
  receivedAt: string
  keysCount: number
  accessCardsCount: number
  electricityReading?: number | null
  electricityMeterPhotoUrl?: string | null
  waterReading?: number | null
  waterMeterPhotoUrl?: string | null
  gasReading?: number | null
  gasMeterPhotoUrl?: string | null
  engineerName?: string | null
  engineerNotes?: string | null
  generalNotes?: string | null
  createdAt?: string
}

export interface FamilyMemberDto {
  id?: string | null
  fullName: string
  relation: FamilyRelation
  nationalId?: string | null
  birthDate?: string | null
}

export interface OccupancyDto {
  id?: string
  unitId?: string
  complexId?: string
  residentId?: string | null
  customerId?: string | null
  primaryResidentName?: string | null
  primaryResidentNationalId?: string | null
  occupancyDate: string
  identityDocumentUrl?: string | null
  totalOccupants: number
  maleCount: number
  femaleCount: number
  occupancyType: OccupancyType
  emergencyContactName?: string | null
  emergencyRelation?: FamilyRelation | null
  emergencyPhone?: string | null
  familyMembers: FamilyMemberDto[]
  createdAt?: string
}

export interface ResidentBuildingStats {
  buildingId: string
  buildingName: string
  blockId: string
  blockName: string
  totalUnits: number
  occupied: number
  available: number
  keyHandedOver: number
}

export interface ResidentProfile {
  id: string
  customerId: string
  unitId: string
  complexId: string
  primaryResidentName: string
  unitNumber?: string | null
  buildingName?: string | null
  occupancyType: OccupancyType
  status: ResidentStatus
  moveInDate: string
  occupancyDate?: string | null
  nationalId?: string | null
  phone?: string | null
  email?: string | null
  identityDocumentUrl?: string | null
  totalOccupants: number
  maleCount: number
  femaleCount: number
  familyMembers: FamilyMemberDto[]
  hasHandover: boolean
  handover?: KeyHandoverDto | null
  emergencyContactName?: string | null
  emergencyRelation?: FamilyRelation | null
  emergencyPhone?: string | null
}

export interface Technician {
  id: string
  name: string | null
  phone: string | null
  department: MaintenanceCategory
  complexId: string
  createdAt: string
}

export interface CreateTechnicianDto {
  name?: string | null
  phone?: string | null
  department: MaintenanceCategory
  complexId: string
}

export type UpdateTechnicianDto = CreateTechnicianDto

export interface Vehicle {
  id: string
  plateNumber: string | null
  model: string | null
  color: string | null
  parkingNumber: string | null
  vehicleType?: number | null
  manufacturer?: string | null
  year?: number | null
  notes?: string | null
  residentId: string
  createdAt: string
}

export interface CreateVehicleDto {
  plateNumber?: string | null
  model?: string | null
  color?: string | null
  parkingNumber?: string | null
  vehicleType?: number | null
  manufacturer?: string | null
  year?: number | null
  notes?: string | null
  residentId: string
}

export type UpdateVehicleDto = CreateVehicleDto

export interface Visitor {
  id: string
  visitorName: string | null
  phone: string | null
  visitDate: string
  entryTime: string
  exitTime: string | null
  residentId: string
  unitId?: string | null
  qrCodeToken?: string | null
  isUsed?: boolean
  validUntil?: string | null
  visitReason?: string | null
  carModel?: string | null
  carPlateNumber?: string | null
  usedAt?: string | null
  createdAt: string
}

export interface CreateVisitorDto {
  visitorName?: string | null
  phone?: string | null
  visitorPhone?: string | null
  visitDate?: string | null
  entryTime?: string | null
  exitTime?: string | null
  residentId: string
  unitId?: string | null
  visitReason?: string | null
  validUntil?: string | null
}

export type UpdateVisitorDto = CreateVisitorDto

export interface ScanVisitorPassDto {
  qrCodeToken: string
  carModel?: string | null
  carPlateNumber?: string | null
}

export interface ScanVisitorPassResult {
  success: boolean
  message: string
  visitorName: string
  residentName: string
  unitNumber: string
  building: string
  visitReason?: string | null
  usedAt: string
  visitorId: string
  qrCodeToken: string
}

export const ReservationStatus = {
  Pending: 1,
  Confirmed: 2,
  Expired: 3,
  Cancelled: 4,
  Converted: 5,
} as const
export type ReservationStatus = (typeof ReservationStatus)[keyof typeof ReservationStatus]

export const ContractStatus = {
  Draft: 1,
  Active: 2,
  Completed: 3,
  Cancelled: 4,
  Suspended: 5,
} as const
export type ContractStatus = (typeof ContractStatus)[keyof typeof ContractStatus]

/** نوع العقد: بيع / إيجار */
export const ContractType = {
  Sale: 1,
  Rent: 2,
} as const
export type ContractType = (typeof ContractType)[keyof typeof ContractType]

/** طريقة دفع العقد (منفصلة عن PaymentMethod للمدفوعات) */
export const ContractPaymentType = {
  Cash: 1,
  RealEstateBank: 2,
  CashInstallments: 3,
} as const
export type ContractPaymentType = (typeof ContractPaymentType)[keyof typeof ContractPaymentType]

/** مصدر التسعير عند إنشاء العقد */
export const PricingMode = {
  Manual: 1,
  System: 2,
  /** جدول دفعات مرتّب قابل لتغيير الترتيب والأشهر */
  CustomSchedule: 3,
} as const
export type PricingMode = (typeof PricingMode)[keyof typeof PricingMode]

/** نطاق خطة الأسعار (توافق قديم) */
export const PricePlanScope = {
  Block: 1,
  Building: 2,
  Unit: 3,
} as const
export type PricePlanScope = (typeof PricePlanScope)[keyof typeof PricePlanScope]

/** نوع تسعير خطة الأسعار */
export const PricePlanPricingType = {
  Amount: 1,
  Percentage: 2,
} as const
export type PricePlanPricingType = (typeof PricePlanPricingType)[keyof typeof PricePlanPricingType]

export const InstallmentStatus = {
  Pending: 1,
  Paid: 2,
  Partial: 3,
  Overdue: 4,
  Cancelled: 5,
} as const
export type InstallmentStatus = (typeof InstallmentStatus)[keyof typeof InstallmentStatus]

export const PaymentMethod = {
  Cash: 1,
  Bank: 2,
  Transfer: 3,
  Cheque: 4,
  Card: 5,
} as const
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod]

export const PaymentPurpose = {
  Installment: 1,
  DownPayment: 2,
  Delivery: 3,
} as const
export type PaymentPurpose = (typeof PaymentPurpose)[keyof typeof PaymentPurpose]

export const InvoiceStatus = {
  Draft: 1,
  Issued: 2,
  Paid: 3,
  Cancelled: 4,
} as const
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus]

export const InvoiceType = {
  Sales: 1,
  Service: 2,
  Installment: 3,
  Other: 4,
} as const
export type InvoiceType = (typeof InvoiceType)[keyof typeof InvoiceType]

export interface Reservation {
  id: string
  reservationDate: string
  reservationAmount: number
  expireDate: string
  status: ReservationStatus
  unitId: string
  customerId: string
  complexId: string
  notes?: string | null
  createdAt: string
}

export interface CreateReservationDto {
  reservationDate: string
  reservationAmount: number
  expireDate: string
  status: ReservationStatus
  unitId: string
  customerId: string
  complexId: string
  notes?: string | null
}

export type UpdateReservationDto = CreateReservationDto

export interface SalesContract {
  id: string
  contractNumber: string | null
  contractDate: string
  contractType: ContractType
  contractPaymentType: ContractPaymentType
  pricingMode: PricingMode
  pricePlanId: string | null
  contractDesignId?: string | null
  exchangeRateUsd?: number | null
  pricePerMeterUsd?: number | null
  displayCurrency?: 'USD' | 'IQD' | string | null
  sellingPrice: number
  discount: number
  tax: number
  registrationFee: number
  downPayment: number
  deliveryAmount: number
  deliveryDate: string | null
  financedAmount: number
  bankName: string | null
  years: number | null
  paymentIntervalMonths: number | null
  firstInstallmentDate: string | null
  remainingAmount: number
  monthsCount: number
  installments: Installment[] | null
  downPaymentInstallments?: Installment[] | null
  downPaymentSchedule?: ContractDownPaymentScheduleItem[] | null
  contractStatus: ContractStatus
  customerId: string
  unitId: string
  salesAgentId: string
  complexId: string
  createdAt: string
  updatedAt?: string
}

export interface ContractInstallmentScheduleItem {
  index: number
  dueDate: string
  amount: number
  percent?: number | null
  kind?: number | null
  name?: string | null
}

export interface ContractDownPaymentScheduleItem {
  name?: string | null
  dueDate: string
  amount: number
}

export interface CreateSalesContractDto {
  contractType: ContractType
  contractPaymentType: ContractPaymentType
  pricingMode: PricingMode
  pricePlanId?: string | null
  contractDesignId?: string | null
  exchangeRateUsd?: number | null
  pricePerMeterUsd?: number | null
  displayCurrency?: 'USD' | 'IQD' | string | null
  sellingPrice: number
  discount: number
  tax: number
  registrationFee: number
  downPayment: number
  deliveryAmount: number
  deliveryDate?: string | null
  financedAmount: number
  bankName?: string | null
  years?: number | null
  paymentIntervalMonths?: number | null
  firstInstallmentDate?: string | null
  /** تاريخ العقد — اختياري؛ إن لم يُرسل يُستخدم تاريخ اليوم */
  contractDate?: string | null
  /** رقم العقد — يُرسل عند التعديل ويُتحقق من تسلسل تصميم العقد */
  contractNumber?: string | null
  contractStatus: ContractStatus
  customerId: string
  unitId: string
  salesAgentId: string
  complexId: string
  /** جدول الأقساط المخصّص — يُحفظ كما أدخل المستخدم */
  installmentSchedule?: ContractInstallmentScheduleItem[] | null
  /** جدول تقسيط المقدمة — مجموع المبالغ = المقدمة */
  downPaymentSchedule?: ContractDownPaymentScheduleItem[] | null
  /** جدول الدفعات الكامل بالترتيب (تغيير اماكن الدفعات) */
  paymentSchedule?: ContractInstallmentScheduleItem[] | null
}

export type UpdateSalesContractDto = CreateSalesContractDto

/** نوع صف جدول خطة الأسعار الموحد */
export const PricePlanScheduleKind = {
  Installment: 0,
  Delivery: 1,
  DownPayment: 2,
} as const
export type PricePlanScheduleKind =
  (typeof PricePlanScheduleKind)[keyof typeof PricePlanScheduleKind]

export interface PricePlanInstallmentItem {
  index: number
  /** 0=دفعة، 1=استلام، 2=مقدمة */
  kind?: PricePlanScheduleKind | number | null
  name?: string | null
  /** عدد الأشهر من تاريخ بداية الجدول */
  monthOffset?: number | null
  dueDate?: string | null
  amount: number
  percent: number
}

export interface PricePlan {
  id: string
  name: string
  scope?: PricePlanScope
  sellingPrice: number
  downPayment: number
  deliveryAmount: number
  discount: number
  tax: number
  registrationFee: number
  pricingType: PricePlanPricingType
  years: number | null
  paymentIntervalMonths: number | null
  firstInstallmentDate: string | null
  installments?: PricePlanInstallmentItem[] | null
  complexId: string
  blockId?: string | null
  buildingId: string | null
  floorId?: string | null
  floorIds?: string[] | null
  unitUi?: UnitUi | null
  unitUis?: UnitUi[] | null
  applyToAllInLocation: boolean
  unitId: string | null
  unitIds?: string[] | null
  createdAt: string
}

export interface CreatePricePlanDto {
  name: string
  complexId: string
  buildingId: string
  floorIds: string[]
  unitUis: UnitUi[]
  applyToAllInLocation: boolean
  unitIds: string[]
  pricingType: PricePlanPricingType
  sellingPrice: number
  downPayment: number
  deliveryAmount: number
  discount: number
  tax: number
  registrationFee: number
  years: number | null
  paymentIntervalMonths: number | null
  firstInstallmentDate: string | null
  installments: PricePlanInstallmentItem[]
}

export type UpdatePricePlanDto = CreatePricePlanDto

export interface ContractClause {
  id: string
  text: string | null
  complexId: string
  createdAt: string
}

export interface CreateContractClauseDto {
  text?: string | null
  complexId: string
}

export type UpdateContractClauseDto = CreateContractClauseDto

/** موضع شعار تصميم العقد */
export const LogoPosition = {
  Right: 'right',
  Left: 'left',
  Center: 'center',
} as const
export type LogoPosition = (typeof LogoPosition)[keyof typeof LogoPosition]

export interface ContractDesignHeader {
  logoUrl?: string | null
  logoPosition?: LogoPosition | string | null
  title?: string | null
  subtitle?: string | null
}

export interface ContractDesignBody {
  /** CSS مخصص يُطبَّق على عرض/طباعة العقد */
  terms?: string | null
  showPaymentTable?: boolean
}

export interface ContractDesignFooter {
  footerText?: string | null
  signatures?: string[] | null
}

export interface ContractDesignStyle {
  primaryColor?: string | null
  fontFamily?: string | null
}

/** 1 = يمين، 2 = يسار */
export type ContractNumberSide = 1 | 2 | 'Right' | 'Left' | 'right' | 'left'

/** 0 = قياسي، 1 = دريم سيتي */
export const PdfLayoutKind = {
  Standard: 0,
  DreamCity: 1,
  TemplateOverlay: 2,
} as const
export type PdfLayoutKind =
  | (typeof PdfLayoutKind)[keyof typeof PdfLayoutKind]
  | 'Standard'
  | 'DreamCity'
  | 'TemplateOverlay'

export interface ClausePageGroup {
  /** رقم الصفحة (الغلاف = 1) */
  page: number
  /** أول بند (1 = البند الأول) */
  fromClause: number
  /** آخر بند */
  toClause: number
}

export interface ContractDesignLayout {
  /** موضع رقم العقد: يمين أو يسار */
  contractNumberSide?: ContractNumberSide | number | null
  /** صفحة البداية (الأطراف). الغلاف = 1 */
  startPage?: number | null
  /** صفحة المقدمة */
  introPage?: number | null
  /** نص مقدمة العقد (متعدد الأسطر + متغيرات) */
  introText?: string | null
  introParcelNumber?: string | null
  introRegistrationPlace?: string | null
  introDistrict?: string | null
  introInvestmentLicenseNo?: string | null
  introInvestmentLicenseDate?: string | null
  /** صفحة البنود الاحتياطية */
  clausesPage?: number | null
  /** توزيع البنود على الصفحات */
  clauseGroups?: ClausePageGroup[] | null
  /** صفحة ملحق العقد (بعد البنود) */
  annexPage?: number | null
  /** توافق قديم */
  paymentTablePage?: number | null
  /** اسم الشركة / الطرف الأول في التواقيع ونص الأطراف */
  sellerSignName?: string | null
  /** اسم الطرف الأول (السيد) — يمثلها مديرها المفوض */
  sellerFirstPartyName?: string | null
  /** رقم هوية الطرف الأول (البطاقة الوطنية) */
  sellerNationalId?: string | null
  /** تسمية الطرف الثاني — الاسم الفعلي من العقد */
  buyerSignTitle?: string | null
  /** عنوان شركة الطرف الأول (دريم سيتي) */
  sellerCompanyAddress?: string | null
  /** تفاصيل الحساب المصرفي للشركة (دريم سيتي) */
  sellerBankDetails?: string | null
}

export interface ContractDesignAssets {
  cornerUnitImagePath?: string | null
  middleUnitImagePath?: string | null
  complexExteriorImagePath?: string | null
}

export interface ContractDesign {
  id: string
  complexName: string | null
  complexId: string
  /** 0 = قياسي (افتراضي)، 1 = دريم سيتي */
  pdfLayoutKind?: PdfLayoutKind | number | null
  contractNumberSequence?: number
  /** اسم المصرف العقاري الافتراضي عند إنشاء عقد بطريقة دفع «مصرف عقاري» */
  realEstateBankName?: string | null
  /** سعر المتر لجدول البيانات المالية في طباعة المصرف */
  pricePerMeter?: number | null
  header: ContractDesignHeader | null
  body: ContractDesignBody | null
  footer: ContractDesignFooter | null
  style: ContractDesignStyle | null
  layout?: ContractDesignLayout | null
  assets?: ContractDesignAssets | null
  templatePath?: string | null
  createdAt: string
}

export interface CreateContractDesignDto {
  complexId: string
  complexName?: string | null
  pdfLayoutKind?: PdfLayoutKind | number | null
  contractNumberSequence?: number
  realEstateBankName?: string | null
  pricePerMeter?: number | null
  header?: ContractDesignHeader | null
  body?: ContractDesignBody | null
  footer?: ContractDesignFooter | null
  style?: ContractDesignStyle | null
  layout?: ContractDesignLayout | null
}

export type UpdateContractDesignDto = CreateContractDesignDto

export interface InstallmentPlan {
  id: string
  totalInstallments: number
  installmentAmount: number
  interestRate: number
  paymentIntervalMonths: number
  firstDueDate: string
  lastDueDate: string
  contractId: string
  complexId: string
  createdAt: string
}

export interface CreateInstallmentPlanDto {
  totalInstallments: number
  installmentAmount: number
  interestRate: number
  paymentIntervalMonths: number
  firstDueDate: string
  lastDueDate: string
  contractId: string
  complexId: string
}

export type UpdateInstallmentPlanDto = CreateInstallmentPlanDto

export interface Installment {
  id: string
  dueDate: string
  amount: number
  paidAmount: number
  penalty: number
  status: InstallmentStatus
  paidDate: string | null
  name?: string | null
  planID: string
  complexId: string
  createdAt: string
}

export interface CreateInstallmentDto {
  dueDate: string
  amount: number
  paidAmount: number
  penalty: number
  status: InstallmentStatus
  paidDate?: string | null
  planID: string
  complexId: string
}

export type UpdateInstallmentDto = CreateInstallmentDto

export interface Payment {
  id: string
  paymentMethod: PaymentMethod
  referenceNumber: string | null
  bankName?: string | null
  notes?: string | null
  amount: number
  paymentDate: string
  installmentId: string | null
  contractId: string
  customerId: string
  receivedById: string
  complexId: string
  purpose: PaymentPurpose
  isPartialSplit: boolean
  installmentLabel?: string | null
  batchId?: string | null
  createdAt: string
}

export interface CreatePaymentDto {
  paymentMethod: PaymentMethod
  referenceNumber?: string | null
  bankName?: string | null
  notes?: string | null
  amount: number
  paymentDate: string
  installmentId?: string | null
  contractId: string
  customerId: string
  receivedById: string
  complexId: string
  purpose?: PaymentPurpose
  splitPartial?: boolean
  batchId?: string | null
}

export type UpdatePaymentDto = CreatePaymentDto

export interface ProcessPaymentResult {
  payment: Payment
  receipt: Receipt | null
  paidInstallment: Installment | null
  debtInstallment: Installment | null
  wasPartialSplit: boolean
}

export interface ProcessBatchPaymentDto {
  paymentMethod: PaymentMethod
  referenceNumber?: string | null
  bankName?: string | null
  notes?: string | null
  amount: number
  paymentDate: string
  contractId: string
  customerId: string
  receivedById: string
  complexId: string
  purpose?: PaymentPurpose
  installmentId?: string | null
  installmentIds?: string[] | null
  applyOverflowToNext?: boolean
}

export interface PaymentAllocation {
  label: string
  installmentId?: string | null
  purpose: PaymentPurpose
  originalRemaining: number
  allocatedAmount: number
  remainingAfter: number
}

export interface ProcessBatchPaymentResult {
  batchId: string
  totalAmount: number
  results: ProcessPaymentResult[]
  allocations: PaymentAllocation[]
}

export interface Invoice {
  id: string
  invoiceType: InvoiceType
  invoiceDate: string
  total: number
  tax: number
  status: InvoiceStatus
  customerId: string
  contractId: string | null
  complexId: string
  createdAt: string
}

export interface CreateInvoiceDto {
  invoiceType: InvoiceType
  invoiceDate: string
  total: number
  tax: number
  status: InvoiceStatus
  customerId: string
  contractId?: string | null
  complexId: string
}

export type UpdateInvoiceDto = CreateInvoiceDto

export interface InvoiceDetail {
  id: string
  description: string | null
  qty: number
  price: number
  total: number
  invoiceId: string
  createdAt: string
}

export interface CreateInvoiceDetailDto {
  description?: string | null
  qty: number
  price: number
  total: number
  invoiceId: string
}

export type UpdateInvoiceDetailDto = CreateInvoiceDetailDto

export interface Receipt {
  id: string
  receiptNumber: string | null
  date: string
  amount: number
  paymentId: string
  createdAt: string
}

export interface CreateReceiptDto {
  receiptNumber?: string | null
  date: string
  amount: number
  paymentId: string
}

export type UpdateReceiptDto = CreateReceiptDto

export interface UnitImage {
  id: string
  unitId: string
  imagePath: string | null
  sortOrder: number
  createdAt: string
}

export interface UnitDocument {
  id: string
  unitId: string
  documentPath: string | null
  title: string | null
  createdAt: string
}

export interface CustomerDocument {
  id: string
  customerId: string
  complexId: string
  referenceNumber: string | null
  notes: string | null
  filePath: string
  originalFileName: string | null
  contentType: string | null
  createdAt: string
}

export const ServiceTypeName = {
  Electricity: 1,
  Water: 2,
  Internet: 3,
  Gas: 4,
  Security: 5,
  Cleaning: 6,
  Landscape: 7,
  Elevator: 8,
  CorridorLighting: 9,
  Other: 10,
} as const
export type ServiceTypeName = (typeof ServiceTypeName)[keyof typeof ServiceTypeName]

export const ServiceBillingMode = {
  Fixed: 1,
  Metered: 2,
} as const
export type ServiceBillingMode = (typeof ServiceBillingMode)[keyof typeof ServiceBillingMode]

export const MeterReadingSource = {
  Manual: 1,
  Api: 2,
} as const
export type MeterReadingSource = (typeof MeterReadingSource)[keyof typeof MeterReadingSource]

export interface ServiceType {
  id: string
  name: ServiceTypeName
  displayName: string
  billingMode: ServiceBillingMode
  fixedAmount: number
  unitPrice: number
  unitOfMeasure: string | null
  readingSource: MeterReadingSource
  isActive: boolean
  complexId: string
  createdAt: string
}

export interface CreateServiceTypeDto {
  name: ServiceTypeName
  displayName: string
  billingMode: ServiceBillingMode
  fixedAmount: number
  unitPrice: number
  unitOfMeasure?: string | null
  readingSource: MeterReadingSource
  isActive: boolean
  complexId: string
}

export type UpdateServiceTypeDto = CreateServiceTypeDto

export interface ServiceBill {
  id: string
  month: number
  year: number
  previousReading: number
  reading: number
  consumption: number
  unitPrice: number
  amount: number
  discount: number
  netAmount: number
  dueDate: string
  paid: boolean
  paymentMethod?: PaymentMethod | null
  paidAt?: string | null
  readingSource: MeterReadingSource
  residentId: string
  residentName?: string | null
  serviceTypeId: string
  serviceDisplayName?: string | null
  billingMode?: ServiceBillingMode | null
  unitOfMeasure?: string | null
  unitId?: string | null
  unitNumber?: string | null
  complexId: string
  createdAt: string
}

export interface CreateServiceBillDto {
  month?: number
  months?: number[]
  year: number
  previousReading: number
  reading: number
  unitPrice?: number | null
  amount?: number | null
  discount?: number
  dueDate?: string | null
  paid: boolean
  paymentMethod?: PaymentMethod | null
  readingSource: MeterReadingSource
  residentId: string
  serviceTypeId: string
  unitId?: string | null
  complexId: string
}

export type UpdateServiceBillDto = CreateServiceBillDto

export interface GenerateFixedServiceBillsDto {
  complexId: string
  month: number
  year: number
  serviceTypeId?: string | null
}

export interface PayMonthlyInvoiceDto {
  complexId: string
  residentId: string
  unitId?: string | null
  month: number
  year: number
  paymentMethod?: PaymentMethod
  /** تاريخ التسديد — إن لم يُرسل يستخدم السيرفر الوقت الحالي */
  paidAt?: string | null
  /** مبلغ الخصم (ليس نسبة) */
  discount?: number
}

export interface PayServiceBillsDto {
  serviceBillIds: string[]
  paymentMethod: PaymentMethod
  /** تاريخ التسديد — إن لم يُرسل يستخدم السيرفر الوقت الحالي */
  paidAt?: string | null
  /** مبلغ الخصم (ليس نسبة) */
  discount?: number
}

export interface MonthlyInvoiceLine {
  serviceBillId: string
  serviceTypeId: string
  serviceDisplayName: string
  billingMode: ServiceBillingMode
  readingSource: MeterReadingSource
  previousReading: number
  reading: number
  consumption: number
  unitOfMeasure?: string | null
  unitPrice: number
  amount: number
  discount: number
  netAmount: number
  paid: boolean
  paymentMethod?: PaymentMethod | null
  paidAt?: string | null
}

export interface MonthlyInvoice {
  complexId: string
  residentId: string
  residentName?: string | null
  unitId?: string | null
  unitNumber?: string | null
  month: number
  year: number
  dueDate: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  fullyPaid: boolean
  lines: MonthlyInvoiceLine[]
}
