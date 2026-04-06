import { z } from 'zod'

export const createItemSchema = z.object({
  barcode: z.string().min(1).optional(), // omit to auto-generate
  customerId: z.string().cuid('Invalid customer ID'),
  itemType: z.string().min(1, 'Item type is required'),
  weight: z
    .number({ invalid_type_error: 'Weight must be a number' })
    .positive('Weight must be positive')
    .multipleOf(0.001, 'Weight supports up to 3 decimal places'),
  description: z.string().optional(),
  pawnDate: z.coerce.date()
})

export const updateItemSchema = z.object({
  itemType: z.string().min(1).optional(),
  weight: z.number().positive().multipleOf(0.001).optional(),
  description: z.string().optional()
  // barcode and customerId intentionally excluded — immutable / not updatable
})

export const itemFilterSchema = z.object({
  status: z.enum(['ACTIVE', 'RELEASED']).optional(),
  customerId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
})

export type CreateItemInput = z.infer<typeof createItemSchema>
export type UpdateItemInput = z.infer<typeof updateItemSchema>
export type ItemFilterInput = z.infer<typeof itemFilterSchema>
