import api from './axios'
import { ApiResponse, Release } from '../types'

export const getReleases = async () => {
  const res = await api.get<ApiResponse<Release[]>>('/releases')
  return res.data.data
}

export const createRelease = async (data: { itemId: string; notes?: string }) => {
  const res = await api.post<ApiResponse<Release>>('/releases', data)
  return res.data.data
}
