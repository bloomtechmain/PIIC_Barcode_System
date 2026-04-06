import api from './axios'
import { ApiResponse, Customer } from '../types'

export const getCustomers = async () => {
  const res = await api.get<ApiResponse<Customer[]>>('/customers')
  return res.data.data
}

export const getCustomer = async (id: string) => {
  const res = await api.get<ApiResponse<Customer>>(`/customers/${id}`)
  return res.data.data
}

export const createCustomer = async (data: {
  name: string
  nic: string
  phone?: string
  email?: string
  address?: string
}) => {
  const res = await api.post<ApiResponse<Customer>>('/customers', data)
  return res.data.data
}

export const updateCustomer = async (
  id: string,
  data: { name?: string; phone?: string; email?: string; address?: string }
) => {
  const res = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data)
  return res.data.data
}
