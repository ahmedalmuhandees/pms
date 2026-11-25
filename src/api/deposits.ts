import { apiClient, unwrap } from './client'
import type { ApiResponse, PagedResult, PaginationParams } from '@/types'

export interface Deposit {
  id: string
  receiptNumber: string
  depositDate: string
  amount: number
  customerId?: string | null
  customerName: string
  customerPhone?: string | null
  reservationId?: string | null
  unitId?: string | null
  unitNumber?: string | null
  unitPrice?: number | null
  pricePerMeter?: number | null
  reservationPercent?: number | null
  reservationAmount?: number | null
  reservationDate?: string | null
  reservationExpireDate?: string | null
  consultantName?: string | null
  notes?: string | null
  transferStatus: number
  transferredAt?: string | null
  complexId: string
  complexName?: string | null
  createdAt: string
}

export interface DepositReservationLookup {
  id: string
  reservationDate: string
  expireDate: string
  reservationAmount: number
  unitPrice?: number | null
  pricePerMeter?: number | null
  reservationPercent?: number | null
  unitNumber?: string | null
  unitId: string
  customerId: string
  customerName: string
  customerPhone?: string | null
  consultantName?: string | null
  notes?: string | null
  complexId: string
  status: number
}

export interface DepositParams extends PaginationParams {
  ComplexId?: string
  CustomerId?: string
  ReservationId?: string
  TransferStatus?: number
  DateFrom?: string
  DateTo?: string
}

export interface CreateDepositPayload {
  complexId: string
  depositDate?: string | null
  amount: number
  customerId?: string | null
  customerName?: string | null
  customerPhone?: string | null
  reservationId?: string | null
  unitId?: string | null
  unitNumber?: string | null
  unitPrice?: number | null
  pricePerMeter?: number | null
  reservationPercent?: number | null
  reservationAmount?: number | null
  reservationDate?: string | null
  reservationExpireDate?: string | null
  consultantName?: string | null
  notes?: string | null
}

export async function getDeposits(params?: DepositParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<Deposit>>>('/api/Deposits', { params })
  return unwrap(res)
}

export async function getDeposit(id: string) {
  const res = await apiClient.get<ApiResponse<Deposit>>(`/api/Deposits/${id}`)
  return unwrap(res)
}

export async function lookupDepositCustomerReservations(complexId: string, customerId: string) {
  const res = await apiClient.get<ApiResponse<DepositReservationLookup[]>>(
    '/api/Deposits/customer-reservations',
    { params: { complexId, customerId } },
  )
  return unwrap(res)
}

export async function createDeposit(payload: CreateDepositPayload) {
  const res = await apiClient.post<ApiResponse<Deposit>>('/api/Deposits', payload)
  return unwrap(res)
}

export async function updateDeposit(id: string, payload: CreateDepositPayload) {
  const res = await apiClient.put<ApiResponse<Deposit>>(`/api/Deposits/${id}`, payload)
  return unwrap(res)
}

export async function deleteDeposit(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/Deposits/${id}`)
  return unwrap(res)
}

export async function updateDepositTransferStatus(id: string, transferStatus: number) {
  const res = await apiClient.patch<ApiResponse<Deposit>>(
    `/api/Deposits/${id}/transfer-status`,
    { transferStatus },
  )
  return unwrap(res)
}
