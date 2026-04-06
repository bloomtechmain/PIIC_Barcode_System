import api from './axios'
import { ApiResponse, Item, Paginated } from '../types'

export const getItems = async (params?: {
  status?: string
  customerId?: string
  page?: number
  limit?: number
}) => {
  const res = await api.get<ApiResponse<Paginated<Item>>>('/items', { params })
  return res.data.data
}

export const getItem = async (id: string) => {
  const res = await api.get<ApiResponse<Item>>(`/items/${id}`)
  return res.data.data
}

export const getItemByBarcode = async (barcode: string) => {
  const res = await api.get<ApiResponse<Item>>(`/items/barcode/${barcode}`)
  return res.data.data
}

export const createItem = async (data: {
  barcode?: string   // omit to auto-generate on server
  customerId: string
  itemType: string
  weight: number
  description?: string
  pawnDate: string
}) => {
  const res = await api.post<ApiResponse<Item>>('/items', data)
  return res.data.data
}

export const updateItem = async (
  id: string,
  data: { itemType?: string; weight?: number; description?: string }
) => {
  const res = await api.put<ApiResponse<Item>>(`/items/${id}`, data)
  return res.data.data
}
