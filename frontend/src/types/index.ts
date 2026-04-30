export type Role = 'ADMIN' | 'STAFF' | 'SUPER_ADMIN'
export type ItemStatus = 'ACTIVE' | 'RELEASED'
export type AuditType = 'STANDARD' | 'INITIAL'
export type AuditItemStatus = 'FOUND' | 'MISSING' | 'UNKNOWN'
export type ScanType = 'AUDIT' | 'CREATE' | 'VERIFY'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
}

export interface Customer {
  id: string
  name: string
  nic: string
  phone?: string
  email?: string
  address?: string
  createdAt: string
  updatedAt: string
  _count?: { items: number }
  items?: Item[]
  branches?: { branch: { id: string; name: string } }[]
}

export interface ItemCorrection {
  id: string
  itemId: string
  auditId: string
  auditItemId: string
  field: string
  oldValue: string
  newValue: string
  correctedAt: string
  correctedBy: { id: string; name: string }
  audit?: { id: string; createdAt: string }
}

export interface ItemEditLog {
  id: string
  itemId: string
  editedById: string
  field: string
  oldValue: string
  newValue: string
  editedAt: string
  editedBy: { id: string; name: string }
}

export interface Item {
  id: string
  barcode: string
  customerId: string
  itemType: string
  weight: number | string
  grossWeight?: number | string | null
  karatage?: number | null
  ticketNo?: string | null
  remarks?: string | null
  description?: string
  pawnDate: string
  status: ItemStatus
  createdAt: string
  updatedAt: string
  customer?: { id: string; name: string; nic: string }
  release?: Release
  barcodeLogs?: BarcodeLog[]
  itemCorrections?: ItemCorrection[]
  editLogs?: ItemEditLog[]
}

export interface Release {
  id: string
  itemId: string
  releasedById: string
  releaseDate: string
  notes?: string
  createdAt: string
  item?: Item
  releasedBy?: { id: string; name: string }
}

export interface Audit {
  id: string
  auditType: AuditType
  createdAt: string
  createdById: string
  totalItemsAtTime: number
  notes?: string
  finalizedAt?: string | null
  filterDateFrom?: string | null
  filterDateTo?: string | null
  filterBranchId?: string | null
  createdBy?: { id: string; name: string }
  _count?: { auditItems: number }
  auditItems?: AuditItem[]
}

export interface AuditItem {
  id: string
  auditId: string
  barcode: string
  status: AuditItemStatus
  itemId?: string | null
  remarks?: string | null
  item?: {
    id: string
    barcode: string
    itemType: string
    weight: number | string
    description?: string | null
    status: ItemStatus
    customer?: { id: string; name: string }
    itemCorrections?: ItemCorrection[]
  } | null
  corrections?: ItemCorrection[]
}

export interface BarcodeLog {
  id: string
  itemId: string
  scannedAt: string
  scanType: ScanType
  scannedBy?: { id: string; name: string } | null
}

export interface Summary {
  inventory: { totalActive: number; totalReleased: number; totalItems: number }
  customers: number
  audits: number
  lastAudit: { id: string; finalizedAt: string; totalItemsAtTime: number } | null
  breakdownByType: { itemType: string; count: number; totalWeight: string | null }[]
}

export interface ActivityLog {
  id: string
  userId: string | null
  action: string
  entity: string | null
  entityId: string | null
  details: Record<string, unknown> | null
  ip: string | null
  createdAt: string
  user: { id: string; name: string; email: string; role: Role } | null
}

export interface Branch {
  id: string
  name: string
  createdAt: string
  _count?: { customers: number }
  customers?: { customer: Customer }[]
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface Paginated<T> {
  items: T[]
  pagination: { total: number; page: number; limit: number; totalPages: number }
}
