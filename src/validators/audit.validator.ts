import { z } from 'zod'

export const createAuditSchema = z.object({
  notes: z.string().optional()
})

export const scanBarcodeSchema = z.object({
  barcode: z.string().min(1, 'Barcode is required')
})

export type CreateAuditInput = z.infer<typeof createAuditSchema>
export type ScanBarcodeInput = z.infer<typeof scanBarcodeSchema>
