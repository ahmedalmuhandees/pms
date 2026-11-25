import { apiClient, unwrap } from './client'
import type { ApiResponse, PagedResult, PaginationParams } from '@/types'

export interface PurchaseForm {
  id: string
  formNumber: string
  formDate: string
  customerId?: string | null
  customerName: string
  customerPhone?: string | null
  address?: string | null
  nationalId?: string | null
  unitId?: string | null
  unitNumber?: string | null
  unitArea?: number | null
  buildingNumber?: string | null
  unitPrice?: number | null
  floor?: string | null
  pricePerMeter?: number | null
  paymentMethod: number
  transferStatus: number
  transferredAt?: string | null
  notes?: string | null
  complexId: string
  complexName?: string | null
  createdAt: string
}

export interface PurchaseFormParams extends PaginationParams {
  ComplexId?: string
  CustomerId?: string
  TransferStatus?: number
  DateFrom?: string
  DateTo?: string
}

export interface CreatePurchaseFormPayload {
  complexId: string
  formDate?: string | null
  customerId?: string | null
  customerName?: string | null
  customerPhone?: string | null
  address?: string | null
  nationalId?: string | null
  unitId?: string | null
  unitNumber?: string | null
  unitArea?: number | null
  buildingNumber?: string | null
  unitPrice?: number | null
  floor?: string | null
  pricePerMeter?: number | null
  paymentMethod: number
  notes?: string | null
}

export async function getPurchaseForms(params?: PurchaseFormParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<PurchaseForm>>>('/api/PurchaseForms', { params })
  return unwrap(res)
}

export async function getPurchaseForm(id: string) {
  const res = await apiClient.get<ApiResponse<PurchaseForm>>(`/api/PurchaseForms/${id}`)
  return unwrap(res)
}

export async function createPurchaseForm(payload: CreatePurchaseFormPayload) {
  const res = await apiClient.post<ApiResponse<PurchaseForm>>('/api/PurchaseForms', payload)
  return unwrap(res)
}

export async function updatePurchaseForm(id: string, payload: CreatePurchaseFormPayload) {
  const res = await apiClient.put<ApiResponse<PurchaseForm>>(`/api/PurchaseForms/${id}`, payload)
  return unwrap(res)
}

export async function updatePurchaseFormTransferStatus(id: string, transferStatus: number) {
  const res = await apiClient.patch<ApiResponse<PurchaseForm>>(
    `/api/PurchaseForms/${id}/transfer-status`,
    { transferStatus },
  )
  return unwrap(res)
}

export async function deletePurchaseForm(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/PurchaseForms/${id}`)
  return unwrap(res)
}
