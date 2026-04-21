import { Request, Response } from 'express'
import * as auditService from '../services/audit.service'
import { createAuditSchema, scanBarcodeSchema, updateAuditItemSchema, bulkReleaseSchema } from '../validators/audit.validator'
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
  const result = await auditService.finalizeAudit(req.params.id, req.user!.userId)
  sendSuccess(res, result, 'Audit finalized')
})

export const updateAuditItem = asyncHandler(async (req: Request, res: Response) => {
  const body = updateAuditItemSchema.parse(req.body)
  const result = await auditService.updateAuditItem(
    req.params.id,
    req.params.itemId,
    body,
    req.user!.userId
  )
  sendSuccess(res, result, 'Audit item updated')
})

export const bulkRelease = asyncHandler(async (req: Request, res: Response) => {
  const body = bulkReleaseSchema.parse(req.body)
  const result = await auditService.bulkRelease(req.params.id, body, req.user!.userId)
  sendCreated(res, result, `${result.released} item(s) released successfully`)
})
