import { z } from 'zod'

export const createBranchSchema = z.object({
  name: z.string().min(2, 'Branch name must be at least 2 characters')
})

export const assignCustomerSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required')
})

export type CreateBranchInput = z.infer<typeof createBranchSchema>
export type AssignCustomerInput = z.infer<typeof assignCustomerSchema>
