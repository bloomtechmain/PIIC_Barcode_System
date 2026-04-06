import api from './axios'
import { ApiResponse, User } from '../types'

export const login = async (email: string, password: string) => {
  const res = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', {
    email,
    password
  })
  return res.data.data
}

export const getProfile = async () => {
  const res = await api.get<ApiResponse<User>>('/auth/me')
  return res.data.data
}

export const registerUser = async (data: {
  name: string
  email: string
  password: string
  role: 'ADMIN' | 'STAFF'
}) => {
  const res = await api.post<ApiResponse<User>>('/auth/register', data)
  return res.data.data
}
