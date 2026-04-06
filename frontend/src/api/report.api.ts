import api from './axios'
import { ApiResponse, Summary } from '../types'

export const getSummary = async () => {
  const res = await api.get<ApiResponse<Summary>>('/reports/summary')
  return res.data.data
}

export const getMissingItems = async () => {
  const res = await api.get<ApiResponse<{
    auditId: string | null
    finalizedAt: string | null
    missingItems: {
      id: string
      barcode: string
      status: string
      item: {
        id: string
        barcode: string
        itemType: string
        weight: number | string
        customer: { id: string; name: string; nic: string; phone?: string }
      } | null
    }[]
  }>>('/reports/missing')
  return res.data.data
}

export const getCustomerHistory = async (customerId: string) => {
  const res = await api.get(`/reports/customer/${customerId}`)
  return res.data.data
}
