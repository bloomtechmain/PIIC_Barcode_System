import api from './axios'
import { ActivityLog, ApiResponse, Paginated } from '../types'

export interface ActivityLogFilter {
  userId?: string
  action?: string
  entity?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export const getActivityLogs = (filter: ActivityLogFilter = {}) => {
  const params = Object.fromEntries(
    Object.entries(filter).filter(([, v]) => v !== undefined && v !== '')
  )
  return api.get<ApiResponse<Paginated<ActivityLog>>>('/activity-logs', { params })
}
