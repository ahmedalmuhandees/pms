import { apiClient, unwrap } from './client'
import type { ApiResponse, Statistics } from '@/types'

export async function getStatistics() {
  const res = await apiClient.get<ApiResponse<Statistics>>('/api/Statistics')
  return unwrap(res)
}
