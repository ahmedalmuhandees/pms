import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  CreateServiceBillDto,
  GenerateFixedServiceBillsDto,
  MonthlyInvoice,
  PagedResult,
  PaginationParams,
  PayMonthlyInvoiceDto,
  PayServiceBillsDto,
  ServiceBill,
  UpdateServiceBillDto,
} from '@/types'

export interface ServiceBillsStats {
  totalAmount: number
  currentMonthTotal: number
  unpaidTotal: number
  currentMonthUnpaid: number
}

export interface ServiceBillParams extends PaginationParams {
  ComplexId?: string
  ResidentId?: string
  ServiceTypeId?: string
  ServiceTypeName?: number
  UnitId?: string
  Month?: number
  Year?: number
  Paid?: boolean
  PaymentMethod?: number
}

export interface MonthlyInvoiceParams extends PaginationParams {
  ComplexId?: string
  ResidentId?: string
  UnitId?: string
  Month?: number
  Year?: number
  FullyPaid?: boolean
}

export async function getServiceBills(params?: ServiceBillParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<ServiceBill>>>('/api/ServiceBills', { params })
  return unwrap(res)
}

export async function getMonthlyInvoices(params?: MonthlyInvoiceParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<MonthlyInvoice>>>('/api/ServiceBills/monthly', {
    params,
  })
  return unwrap(res)
}

export async function getServiceBillsStats(
  complexId?: string | null,
  serviceTypeName?: number | null,
) {
  const res = await apiClient.get<ApiResponse<ServiceBillsStats>>('/api/ServiceBills/stats', {
    params: {
      ...(complexId ? { complexId } : {}),
      ...(serviceTypeName != null ? { serviceTypeName } : {}),
    },
  })
  return unwrap(res)
}

export async function getServiceBill(id: string) {
  const res = await apiClient.get<ApiResponse<ServiceBill>>(`/api/ServiceBills/${id}`)
  return unwrap(res)
}

export async function createServiceBill(payload: CreateServiceBillDto) {
  const res = await apiClient.post<ApiResponse<ServiceBill[]>>('/api/ServiceBills', payload)
  return unwrap(res)
}

export async function generateFixedServiceBills(payload: GenerateFixedServiceBillsDto) {
  const res = await apiClient.post<ApiResponse<number>>('/api/ServiceBills/generate-fixed', payload)
  return unwrap(res)
}

export async function payMonthlyInvoice(payload: PayMonthlyInvoiceDto) {
  const res = await apiClient.post<ApiResponse<MonthlyInvoice>>('/api/ServiceBills/monthly/pay', payload)
  return unwrap(res)
}

export async function payServiceBills(payload: PayServiceBillsDto) {
  const res = await apiClient.post<ApiResponse<ServiceBill[]>>('/api/ServiceBills/pay', payload)
  return unwrap(res)
}

export async function updateServiceBill(id: string, payload: UpdateServiceBillDto) {
  const res = await apiClient.put<ApiResponse<ServiceBill>>(`/api/ServiceBills/${id}`, payload)
  return unwrap(res)
}

export async function deleteServiceBill(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/ServiceBills/${id}`)
  return unwrap(res)
}
