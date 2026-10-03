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
}

export interface UserInfo {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  role: string | null
  complexId: string | null
  isSuperAdmin: boolean
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
  Single: 1,
  Married: 2,
  Divorced: 3,
  Widowed: 4,
} as const
export type MaritalStatus = (typeof MaritalStatus)[keyof typeof MaritalStatus]

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

export const ResidentStatus = {
  Active: 1,
  MovedOut: 2,
  Evicted: 3,
} as const
export type ResidentStatus = (typeof ResidentStatus)[keyof typeof ResidentStatus]

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
}

export type UpdateEmployeeDto = CreateEmployeeDto

export interface Resident {
  id: string
  moveInDate: string
  moveOutDate: string | null
  status: ResidentStatus
  customerId: string
  unitId: string
  complexId: string
  createdAt: string
}

export interface CreateResidentDto {
  moveInDate: string
  moveOutDate?: string | null
  status: ResidentStatus
  customerId: string
  unitId: string
  complexId: string
}

export type UpdateResidentDto = CreateResidentDto

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
  residentId: string
  createdAt: string
}

export interface CreateVehicleDto {
  plateNumber?: string | null
  model?: string | null
  color?: string | null
  parkingNumber?: string | null
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
  createdAt: string
}

export interface CreateVisitorDto {
  visitorName?: string | null
  phone?: string | null
  visitDate: string
  entryTime: string
  exitTime?: string | null
  residentId: string
}

export type UpdateVisitorDto = CreateVisitorDto

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
} as const
export type ContractPaymentType = (typeof ContractPaymentType)[keyof typeof ContractPaymentType]

/** مصدر التسعير عند إنشاء العقد */
export const PricingMode = {
  Manual: 1,
  System: 2,
} as const
export type PricingMode = (typeof PricingMode)[keyof typeof PricingMode]

/** نطاق خطة الأسعار */
export const PricePlanScope = {
  Block: 1,
  Building: 2,
  Unit: 3,
} as const
export type PricePlanScope = (typeof PricePlanScope)[keyof typeof PricePlanScope]

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
  BankTransfer: 2,
  Cheque: 3,
  Card: 4,
  Online: 5,
} as const
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod]

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
  contractStatus: ContractStatus
  customerId: string
  unitId: string
  salesAgentId: string
  complexId: string
  createdAt: string
}

export interface CreateSalesContractDto {
  contractType: ContractType
  contractPaymentType: ContractPaymentType
  pricingMode: PricingMode
  pricePlanId?: string | null
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
  contractStatus: ContractStatus
  customerId: string
  unitId: string
  salesAgentId: string
  complexId: string
}

export type UpdateSalesContractDto = CreateSalesContractDto

export interface PricePlan {
  id: string
  scope: PricePlanScope
  sellingPrice: number
  discount: number
  tax: number
  registrationFee: number
  complexId: string
  blockId: string | null
  buildingId: string | null
  unitId: string | null
  createdAt: string
}

export interface CreatePricePlanDto {
  scope: PricePlanScope
  sellingPrice: number
  discount: number
  tax: number
  registrationFee: number
  complexId: string
  blockId?: string | null
  buildingId?: string | null
  unitId?: string | null
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

export interface ContractDesign {
  id: string
  complexName: string | null
  complexId: string
  header: ContractDesignHeader | null
  body: ContractDesignBody | null
  footer: ContractDesignFooter | null
  style: ContractDesignStyle | null
  createdAt: string
}

export interface CreateContractDesignDto {
  complexId: string
  complexName?: string | null
  header?: ContractDesignHeader | null
  body?: ContractDesignBody | null
  footer?: ContractDesignFooter | null
  style?: ContractDesignStyle | null
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
  amount: number
  paymentDate: string
  installmentId: string | null
  contractId: string
  customerId: string
  receivedById: string
  complexId: string
  createdAt: string
}

export interface CreatePaymentDto {
  paymentMethod: PaymentMethod
  referenceNumber?: string | null
  amount: number
  paymentDate: string
  installmentId?: string | null
  contractId: string
  customerId: string
  receivedById: string
  complexId: string
}

export type UpdatePaymentDto = CreatePaymentDto

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
