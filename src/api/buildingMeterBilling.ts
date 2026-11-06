import { apiClient, unwrap } from './client'
import type { ApiResponse, ServiceTypeName } from '@/types'

export interface UnitMeterDraftLine {
  residentId: string
  unitId: string
  residentName: string | null
  unitNumber: string | null
  previousReading: number
  suggestedCurrentReading: number | null
  isNewOccupancy: boolean
  hasHistory: boolean
}

export interface DirectMeterDraft {
  buildingId: string
  buildingName: string | null
  serviceTypeName: ServiceTypeName
  previousPeriodMonth: number
  previousPeriodYear: number
  suggestedCurrentPeriodMonth: number
  suggestedCurrentPeriodYear: number
  lastUnitPrice: number
  hasHistory: boolean
  newOccupancyCount: number
  lines: UnitMeterDraftLine[]
}

export interface UnitMeterIssueLineResult {
  residentId: string
  unitId: string
  residentName: string | null
  unitNumber: string | null
  previousReading: number
  currentReading: number
  consumption: number
  amount: number
  billCreated: boolean
  skipped: boolean
  message: string | null
}

export interface BuildingMeterIssueResult {
  billsCreated: number
  billsSkipped: number
  readingsCreated: number
  message: string
  lines: UnitMeterIssueLineResult[]
}

export interface ExcelImportResult {
  rowsProcessed: number
  readingsCreated: number
  billsCreated: number
  billsSkipped: number
  errors: string[]
  lines: UnitMeterIssueLineResult[]
}

export interface DirectUnitMeterLineDto {
  residentId: string
  unitId: string
  currentReading: number
  previousReading?: number | null
}

export interface DirectBuildingMeterEntryDto {
  complexId: string
  buildingId: string
  serviceTypeName: ServiceTypeName
  unitPrice: number
  currentPeriodMonth?: number | null
  currentPeriodYear?: number | null
  lines: DirectUnitMeterLineDto[]
}

export async function getDirectMeterDraft(params: {
  complexId: string
  buildingId: string
  serviceTypeName: ServiceTypeName
}) {
  const res = await apiClient.get<ApiResponse<DirectMeterDraft>>(
    '/api/BuildingMeterBilling/direct-draft',
    { params },
  )
  return unwrap(res)
}

export async function issueDirectBuildingMeter(payload: DirectBuildingMeterEntryDto) {
  const res = await apiClient.post<ApiResponse<BuildingMeterIssueResult>>(
    '/api/BuildingMeterBilling/direct',
    payload,
  )
  return unwrap(res)
}

export async function importBuildingMeterExcel(params: {
  complexId: string
  buildingId: string
  serviceTypeName: ServiceTypeName
  file: File
}) {
  const form = new FormData()
  form.append('complexId', params.complexId)
  form.append('buildingId', params.buildingId)
  form.append('serviceTypeName', String(params.serviceTypeName))
  form.append('file', params.file)
  const res = await apiClient.post<ApiResponse<ExcelImportResult>>(
    '/api/BuildingMeterBilling/import-excel',
    form,
  )
  return unwrap(res)
}

export interface UnitLastReading {
  unitId: string
  residentId: string
  previousReading: number
  currentReading: number
  unitPrice: number
  currentPeriodMonth: number
  currentPeriodYear: number
  hasHistory: boolean
}

export interface ElectricityReportFilter {
  complexId?: string | null
  buildingId?: string | null
  serviceTypeName?: ServiceTypeName | null
  fromMonth?: number | null
  fromYear?: number | null
  toMonth?: number | null
  toYear?: number | null
  paid?: boolean | null
  overdueOnly?: boolean | null
  readingSource?: number | null
  unitOccupancy?: string | null
  search?: string | null
}

export interface ElectricityReportKpis {
  totalConsumption: number
  totalBilledAmount: number
  totalCollectedAmount: number
  totalOutstandingAmount: number
  averageConsumptionPerUnit: number
  activeUnitsCount: number
  billsCount: number
}

export interface ElectricityReportRow {
  billId: string
  unitNumber: string | null
  buildingName: string | null
  buildingId: string | null
  residentName: string | null
  month: number
  year: number
  previousPeriodMonth: number
  previousPeriodYear: number
  currentPeriodMonth: number
  currentPeriodYear: number
  previousReadingDate: string
  currentReadingDate: string
  previousReading: number
  reading: number
  consumption: number
  unitPrice: number
  amount: number
  discount: number
  netAmount: number
  paid: boolean
  overdue: boolean
  readingSource: number
  dueDate: string
}

export interface ElectricityReport {
  kpis: ElectricityReportKpis
  buildingConsumption: { buildingId: string | null; buildingName: string; consumption: number; amount: number }[]
  monthlyTrend: { year: number; month: number; label: string; consumption: number; amount: number }[]
  paymentShare: { paidAmount: number; unpaidAmount: number; paidCount: number; unpaidCount: number }
  rows: ElectricityReportRow[]
}

export async function getLastUnitReading(params: {
  complexId: string
  unitId: string
  serviceTypeName: ServiceTypeName
}) {
  const res = await apiClient.get<ApiResponse<UnitLastReading>>(
    '/api/BuildingMeterBilling/last-unit-reading',
    { params },
  )
  return unwrap(res)
}

export async function getElectricityReport(params?: ElectricityReportFilter) {
  const res = await apiClient.get<ApiResponse<ElectricityReport>>(
    '/api/BuildingMeterBilling/electricity-report',
    { params },
  )
  return unwrap(res)
}
