import { z } from 'zod'

export const createReleaseSchema = z.object({
  itemId: z.string().cuid('Invalid item ID'),
  notes: z.string().optional()
})

export type CreateReleaseInput = z.infer<typeof createReleaseSchema>
