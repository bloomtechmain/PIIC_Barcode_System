import { Request, Response } from 'express'
import * as reportService from '../services/report.service'
import { sendSuccess } from '../utils/response'
import { asyncHandler } from '../utils/async-handler'

export const getSummary = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await reportService.getSummary()
  sendSuccess(res, summary)
})

export const getMissingItems = asyncHandler(async (_req: Request, res: Response) => {
  const result = await reportService.getMissingItems()
  sendSuccess(res, result)
})

export const getCustomerHistory = asyncHandler(async (req: Request, res: Response) => {
  const result = await reportService.getCustomerHistory(req.params.customerId)
  sendSuccess(res, result)
})
