import { Request, Response } from 'express'
import * as auditService from '../services/audit.service'
import { createAuditSchema, scanBarcodeSchema } from '../validators/audit.validator'
import { sendSuccess, sendCreated } from '../utils/response'
import { asyncHandler } from '../utils/async-handler'

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const audits = await auditService.findAll()
  sendSuccess(res, audits)
})

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const audit = await auditService.findById(req.params.id)
  sendSuccess(res, audit)
})

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = createAuditSchema.parse(req.body)
  const audit = await auditService.create(body, req.user!.userId)
  sendCreated(res, audit, 'Audit session started')
})

export const scan = asyncHandler(async (req: Request, res: Response) => {
  const { barcode } = scanBarcodeSchema.parse(req.body)
  const auditItem = await auditService.scanBarcode(req.params.id, barcode, req.user!.userId)
  sendCreated(res, auditItem, `Barcode scanned — status: ${auditItem.status}`)
})

export const finalize = asyncHandler(async (req: Request, res: Response) => {
  const result = await auditService.finalizeAudit(req.params.id)
  sendSuccess(res, result, 'Audit finalized')
})
