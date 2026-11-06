import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  CreateSalesContractDto,
  SalesContract,
  PagedResult,
  PaginationParams,
  UpdateSalesContractDto,
} from '@/types'

export interface SalesContractParams extends PaginationParams {
  ComplexId?: string
  CustomerId?: string
  UnitId?: string
  SalesAgentId?: string
  ContractStatus?: string | number
  ContractPaymentType?: string | number
}

export async function getSalesContracts(params?: SalesContractParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<SalesContract>>>('/api/SalesContracts', { params })
  return unwrap(res)
}

export async function getSalesContract(id: string) {
  const res = await apiClient.get<ApiResponse<SalesContract>>(`/api/SalesContracts/${id}`)
  return unwrap(res)
}

export async function createSalesContract(payload: CreateSalesContractDto) {
  const res = await apiClient.post<ApiResponse<SalesContract>>('/api/SalesContracts', payload)
  return unwrap(res)
}

export async function updateSalesContract(id: string, payload: UpdateSalesContractDto) {
  const res = await apiClient.put<ApiResponse<SalesContract>>(`/api/SalesContracts/${id}`, payload)
  return unwrap(res)
}

export async function deleteSalesContract(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/SalesContracts/${id}`)
  return unwrap(res)
}

export interface BankPdfPaymentLine {
  label: string
  amount: number
}

export interface BankPdfOptions {
  paymentLines?: BankPdfPaymentLine[]
}

export async function downloadSalesContractPdf(
  id: string,
  variant?: 'bank' | string,
  options?: BankPdfOptions,
) {
  if (options?.paymentLines?.length) {
    const res = await apiClient.post(
      `/api/SalesContracts/${id}/pdf`,
      { paymentLines: options.paymentLines },
      {
        responseType: 'blob',
        params: variant ? { variant } : undefined,
      },
    )
    return res.data as Blob
  }

  const res = await apiClient.get(`/api/SalesContracts/${id}/pdf`, {
    responseType: 'blob',
    params: variant ? { variant } : undefined,
  })
  return res.data as Blob
}
