import { Request, Response } from 'express'
import * as releaseService from '../services/release.service'
import { createReleaseSchema } from '../validators/release.validator'
import { sendSuccess, sendCreated } from '../utils/response'
import { asyncHandler } from '../utils/async-handler'

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const releases = await releaseService.findAll()
  sendSuccess(res, releases)
})

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const release = await releaseService.findById(req.params.id)
  sendSuccess(res, release)
})

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = createReleaseSchema.parse(req.body)
  const release = await releaseService.create(body, req.user!.userId)
  sendCreated(res, release, 'Item released successfully')
})
