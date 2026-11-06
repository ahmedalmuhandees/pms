import { apiClient, unwrap } from './client'
import type { ApiResponse, PaymentMethod } from '@/types'

export const GeneralReportFilterMode = {
  BillingPeriod: 1,
  PaymentDate: 2,
} as const
export type GeneralReportFilterMode =
  (typeof GeneralReportFilterMode)[keyof typeof GeneralReportFilterMode]

export const GeneralReportServiceScope = {
  All: 0,
  FixedServices: 1,
  Electricity: 2,
  Gas: 3,
  Water: 4,
} as const
export type GeneralReportServiceScope =
  (typeof GeneralReportServiceScope)[keyof typeof GeneralReportServiceScope]

export interface GeneralReportFilter {
  complexId?: string | null
  buildingId?: string | null
  filterMode?: GeneralReportFilterMode
  month?: number | null
  year?: number | null
  fromDate?: string | null
  toDate?: string | null
  paid?: boolean | null
  serviceScope?: GeneralReportServiceScope
  paymentMethod?: PaymentMethod | null
  search?: string | null
}

export interface GeneralReportRow {
  billId: string
  unitNumber: string | null
  buildingName: string | null
  buildingId: string | null
  residentName: string | null
  serviceDisplayName: string
  serviceTypeName: number
  billingMode: number
  month: number
  year: number
  periodLabel: string
  amount: number
  discount: number
  netAmount: number
  paid: boolean
  paidAt: string | null
  paymentMethod: number | null
  dueDate: string
}

export interface GeneralReport {
  cash: {
    cashCollectedInPeriod: number
    arrearsCollectedInPeriod: number
    currentPeriodCollectedCash: number
  }
  accrual: {
    totalBilled: number
    totalPaid: number
    totalUnpaid: number
    totalDiscount: number
  }
  operational: {
    totalUnits: number
    paidUnits: number
    unpaidUnits: number
    collectionRate: number
    complianceRate: number
    topCollectedServiceName: string | null
    topCollectedServiceAmount: number
  }
  rows: GeneralReportRow[]
}

export async function getGeneralReport(params?: GeneralReportFilter) {
  const res = await apiClient.get<ApiResponse<GeneralReport>>('/api/ServiceBills/general-report', {
    params,
  })
  return unwrap(res)
}
