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

export type CreateAuditInput     = z.infer<typeof createAuditSchema>
export type ScanBarcodeInput     = z.infer<typeof scanBarcodeSchema>
export type UpdateAuditItemInput = z.infer<typeof updateAuditItemSchema>
export type BulkReleaseInput     = z.infer<typeof bulkReleaseSchema>
