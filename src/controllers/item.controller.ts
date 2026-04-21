import { Request, Response } from 'express'
import * as itemService from '../services/item.service'
import {
  createItemSchema,
  updateItemSchema,
  itemFilterSchema
} from '../validators/item.validator'
import { sendSuccess, sendCreated } from '../utils/response'
import { asyncHandler } from '../utils/async-handler'

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const filters = itemFilterSchema.parse(req.query)
  const result = await itemService.findAll(filters)
  sendSuccess(res, result)
})

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const item = await itemService.findById(req.params.id)
  sendSuccess(res, item)
})

export const getByBarcode = asyncHandler(async (req: Request, res: Response) => {
  const item = await itemService.findByBarcode(req.params.barcode)
  sendSuccess(res, item)
})

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = createItemSchema.parse(req.body)
  const item = await itemService.create(body, req.user!.userId)
  sendCreated(res, item, 'Item pawned successfully')
})

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = updateItemSchema.parse(req.body)
  const item = await itemService.update(req.params.id, body, req.user!.userId)
  sendSuccess(res, item, 'Item updated successfully')
})

export const verifyBarcode = asyncHandler(async (req: Request, res: Response) => {
  const item = await itemService.verifyBarcode(req.params.barcode, req.user!.userId)
  if (item) {
    sendSuccess(res, item, 'Barcode verified')
  } else {
    sendSuccess(res, null, 'Barcode not found in system')
  }
})
