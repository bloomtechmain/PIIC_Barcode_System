import api from './axios'
import { ApiResponse, Branch } from '../types'

export const getBranches = async () => {
  const res = await api.get<ApiResponse<Branch[]>>('/branches')
  return res.data.data
}

export const getBranch = async (id: string) => {
  const res = await api.get<ApiResponse<Branch>>(`/branches/${id}`)
  return res.data.data
}

export const createBranch = async (data: { name: string }) => {
  const res = await api.post<ApiResponse<Branch>>('/branches', data)
  return res.data.data
}

export const deleteBranch = async (id: string) => {
  await api.delete(`/branches/${id}`)
}

export const assignCustomer = async (branchId: string, customerId: string) => {
  await api.post(`/branches/${branchId}/customers`, { customerId })
}

export const removeCustomer = async (branchId: string, customerId: string) => {
  await api.delete(`/branches/${branchId}/customers/${customerId}`)
}
