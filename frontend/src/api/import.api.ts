import api from './axios'
import { ApiResponse } from '../types'

export interface ImportResult {
  customersCreated: number
  customersFound: number
  itemsCreated: number
  itemsSkipped: number
  errors: string[]
}

export const importCSV = async (file: File): Promise<ImportResult> => {
  const form = new FormData()
  form.append('file', file)
  const res = await api.post<ApiResponse<ImportResult>>('/import/csv', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data.data
}
