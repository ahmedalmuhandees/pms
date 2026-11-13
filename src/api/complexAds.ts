import { apiClient, unwrap } from './client'
import type { ApiResponse } from '@/types'

export interface ComplexAd {
  id: string
  complexId: string
  title?: string | null
  titleAr?: string | null
  titleKu?: string | null
  linkUrl?: string | null
  imageUrl: string
  sortOrder: number
  isActive: boolean
  startsAt?: string | null
  endsAt?: string | null
  createdAt: string
}

export async function getComplexAds(complexId: string) {
  const res = await apiClient.get<ApiResponse<ComplexAd[]>>('/api/ComplexAds', {
    params: { complexId },
  })
  return unwrap(res)
}

export async function createComplexAd(form: FormData) {
  const res = await apiClient.post<ApiResponse<ComplexAd>>('/api/ComplexAds', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return unwrap(res)
}

export async function updateComplexAd(id: string, form: FormData) {
  const res = await apiClient.put<ApiResponse<ComplexAd>>(`/api/ComplexAds/${id}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return unwrap(res)
}

export async function deleteComplexAd(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/ComplexAds/${id}`)
  return unwrap(res)
}
