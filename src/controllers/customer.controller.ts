import { Request, Response } from 'express'
import * as customerService from '../services/customer.service'
import { createCustomerSchema, updateCustomerSchema } from '../validators/customer.validator'
import { sendSuccess, sendCreated } from '../utils/response'
import { asyncHandler } from '../utils/async-handler'

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const customers = await customerService.findAll()
  sendSuccess(res, customers)
})

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.findById(req.params.id)
  sendSuccess(res, customer)
})

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = createCustomerSchema.parse(req.body)
  const customer = await customerService.create(body, req.user!.userId)
  sendCreated(res, customer, 'Customer created successfully')
})

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = updateCustomerSchema.parse(req.body)
  const customer = await customerService.update(req.params.id, body, req.user!.userId)
  sendSuccess(res, customer, 'Customer updated successfully')
})
