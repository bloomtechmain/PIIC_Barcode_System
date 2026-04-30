import { z } from 'zod'

export const createAuditSchema = z.object({
  notes: z.string().optional()
})

export const scanBarcodeSchema = z.object({
  barcode: z.string().min(1, 'Barcode is required')
})

export const updateAuditItemSchema = z.object({
  remarks: z.string().optional(),
  corrections: z.array(z.object({
    field: z.enum(['itemType', 'weight', 'description']),
    newValue: z.string().min(1, 'New value is required')
  })).optional()
})

export const bulkReleaseSchema = z.object({
  itemIds: z.array(z.string().cuid()).min(1, 'At least one item is required'),
  notes: z.string().optional()
})

export const addAuditItemSchema = z.object({
  customerId:  z.string().cuid('Invalid customer ID'),
  ticketNo:    z.string().min(1, 'Ticket number is required'),
  pawnDate:    z.string().min(1, 'Pawn date is required'),
  itemType:    z.string().min(1, 'Item type is required'),
  weight:      z.number().positive('Weight must be positive'),
  grossWeight: z.number().positive().optional().nullable(),
  karatage:    z.number().int().min(1).max(24).optional().nullable(),
  remarks:     z.string().optional().nullable(),
})

export const createInitialAuditSchema = z.object({
  notes:          z.string().optional(),
  filterDateFrom: z.string().optional(),
  filterDateTo:   z.string().optional(),
  filterBranchId: z.string().optional(),
})

export type AddAuditItemInput       = z.infer<typeof addAuditItemSchema>
export type CreateAuditInput        = z.infer<typeof createAuditSchema>
export type ScanBarcodeInput        = z.infer<typeof scanBarcodeSchema>
export type UpdateAuditItemInput    = z.infer<typeof updateAuditItemSchema>
export type BulkReleaseInput        = z.infer<typeof bulkReleaseSchema>
export type CreateInitialAuditInput = z.infer<typeof createInitialAuditSchema>
