import api from './axios'
import { ApiResponse, Audit, AuditItem } from '../types'

export const getAudits = async () => {
  const res = await api.get<ApiResponse<Audit[]>>('/audits')
  return res.data.data
}

export const getAudit = async (id: string) => {
  const res = await api.get<ApiResponse<Audit>>(`/audits/${id}`)
  return res.data.data
}

export const createAudit = async (data: { notes?: string }) => {
  const res = await api.post<ApiResponse<Audit>>('/audits', data)
  return res.data.data
}

export const scanBarcode = async (auditId: string, barcode: string) => {
  const res = await api.post<ApiResponse<AuditItem>>(`/audits/${auditId}/scan`, { barcode })
  return res.data.data
}

export const updateAuditItem = async (
  auditId: string,
  auditItemId: string,
  data: { remarks?: string; corrections?: { field: string; newValue: string }[] }
) => {
  const res = await api.patch<ApiResponse<AuditItem>>(`/audits/${auditId}/items/${auditItemId}`, data)
  return res.data.data
}

export const bulkRelease = async (
  auditId: string,
  data: { itemIds: string[]; notes?: string }
) => {
  const res = await api.post<ApiResponse<{
    released: number
    skipped: number
    releases: { id: string; itemId: string }[]
  }>>(`/audits/${auditId}/bulk-release`, data)
  return res.data.data
}

export const finalizeAudit = async (auditId: string) => {
  const res = await api.post<ApiResponse<{
    auditId: string
    totalActive: number
    scanned: number
    found: number
    missing: number
    finalizedAt: string
  }>>(`/audits/${auditId}/finalize`)
  return res.data.data
}
