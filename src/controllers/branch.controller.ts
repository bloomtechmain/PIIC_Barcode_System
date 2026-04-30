import { Request, Response } from 'express'
import * as branchService from '../services/branch.service'
import { createBranchSchema, assignCustomerSchema } from '../validators/branch.validator'
import { sendSuccess, sendCreated } from '../utils/response'
import { asyncHandler } from '../utils/async-handler'

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const branches = await branchService.findAll()
  sendSuccess(res, branches)
})

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const branch = await branchService.findById(req.params.id)
  sendSuccess(res, branch)
})

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = createBranchSchema.parse(req.body)
  const branch = await branchService.create(body, req.user!.userId)
  sendCreated(res, branch, 'Branch created successfully')
})

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await branchService.remove(req.params.id, req.user!.userId)
  sendSuccess(res, null, 'Branch deleted successfully')
})

export const assignCustomer = asyncHandler(async (req: Request, res: Response) => {
  const body = assignCustomerSchema.parse(req.body)
  await branchService.assignCustomer(req.params.id, body, req.user!.userId)
  sendSuccess(res, null, 'Customer assigned to branch')
})

export const removeCustomer = asyncHandler(async (req: Request, res: Response) => {
  await branchService.removeCustomer(req.params.id, req.params.customerId, req.user!.userId)
  sendSuccess(res, null, 'Customer removed from branch')
})
