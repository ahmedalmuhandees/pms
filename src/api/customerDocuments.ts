import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  CustomerDocument,
  PagedResult,
  PaginationParams,
} from '@/types'

export async function getCustomerDocuments(customerId: string, params?: PaginationParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<CustomerDocument>>>(
    `/api/customers/${customerId}/documents`,
    { params },
  )
  return unwrap(res)
}

export async function uploadCustomerDocument(
  customerId: string,
  file: File,
  payload: { referenceNumber?: string | null; notes?: string | null },
) {
  const form = new FormData()
  form.append('file', file)
  if (payload.referenceNumber) form.append('ReferenceNumber', payload.referenceNumber)
  if (payload.notes) form.append('Notes', payload.notes)
  const res = await apiClient.post<ApiResponse<CustomerDocument>>(
    `/api/customers/${customerId}/documents`,
    form,
  )
  return unwrap(res)
}

export async function deleteCustomerDocument(customerId: string, id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(
    `/api/customers/${customerId}/documents/${id}`,
  )
  return unwrap(res)
}

/** تنزيل ملف المستند (مصادَق) بعد الرفع والحفظ */
export async function downloadCustomerDocument(customerId: string, id: string) {
  const res = await apiClient.get<Blob>(`/api/customers/${customerId}/documents/${id}/download`, {
    responseType: 'blob',
  })
  return res.data
}
