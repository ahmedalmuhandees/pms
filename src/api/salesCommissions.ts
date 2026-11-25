import { apiClient, unwrap } from './client'
import type { ApiResponse, PagedResult, PaginationParams, SalesCommissionSource } from '@/types'

export interface SalesCommission {
  id: string
  receiptNumber: string
  receiptDate: string
  source: SalesCommissionSource
  salesContractId?: string | null
  contractNumber?: string | null
  reservationId?: string | null
  customerName: string
  customerPhone?: string | null
  unitNumber?: string | null
  sellingPrice: number
  commissionPercent: number
  commissionAmount: number
  description: string
  consultantName?: string | null
  accountantName: string
  showRefundDisclaimer?: boolean
  complexId: string
  complexName?: string | null
  createdAt: string
}

export interface SalesCommissionContractLookup {
  id: string
  contractNumber: string
  customerName: string
  customerPhone?: string | null
  unitNumber?: string | null
  sellingPrice: number
  complexId: string
  consultantName?: string | null
}

export interface SalesCommissionReservationLookup {
  id: string
  reservationDate: string
  customerName: string
  customerPhone?: string | null
  unitNumber?: string | null
  sellingPrice: number
  reservationAmount: number
  consultantName?: string | null
  complexId: string
}

export interface SalesCommissionParams extends PaginationParams {
  ComplexId?: string
  SalesContractId?: string
  DateFrom?: string
  DateTo?: string
}

export interface CreateSalesCommissionPayload {
  source: SalesCommissionSource
  salesContractId?: string | null
  reservationId?: string | null
  complexId: string
  receiptDate?: string | null
  commissionPercent: number
  commissionAmount?: number | null
  description?: string | null
  consultantName?: string | null
  showRefundDisclaimer?: boolean
}

export async function getSalesCommissions(params?: SalesCommissionParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<SalesCommission>>>('/api/SalesCommissions', {
    params,
  })
  return unwrap(res)
}

export async function getSalesCommission(id: string) {
  const res = await apiClient.get<ApiResponse<SalesCommission>>(`/api/SalesCommissions/${id}`)
  return unwrap(res)
}

export async function lookupSalesCommissionContracts(complexId: string, search?: string) {
  const res = await apiClient.get<ApiResponse<SalesCommissionContractLookup[]>>(
    '/api/SalesCommissions/contracts',
    { params: { complexId, search } },
  )
  return unwrap(res)
}

export async function lookupSalesCommissionReservations(complexId: string, search?: string) {
  const res = await apiClient.get<ApiResponse<SalesCommissionReservationLookup[]>>(
    '/api/SalesCommissions/reservations',
    { params: { complexId, search } },
  )
  return unwrap(res)
}

export async function createSalesCommission(payload: CreateSalesCommissionPayload) {
  const res = await apiClient.post<ApiResponse<SalesCommission>>('/api/SalesCommissions', payload)
  return unwrap(res)
}

export async function updateSalesCommission(id: string, payload: CreateSalesCommissionPayload) {
  const res = await apiClient.put<ApiResponse<SalesCommission>>(`/api/SalesCommissions/${id}`, payload)
  return unwrap(res)
}

export async function deleteSalesCommission(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/SalesCommissions/${id}`)
  return unwrap(res)
}
