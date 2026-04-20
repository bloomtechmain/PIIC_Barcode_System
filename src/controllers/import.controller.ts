import { Request, Response } from 'express'
import { asyncHandler } from '../utils/async-handler'
import { sendSuccess } from '../utils/response'
import { importFromBuffer } from '../services/import.service'
import { AppError } from '../middleware/error'

export const importCSV = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded', 400)

  const result = await importFromBuffer(req.file.buffer, req.user!.userId)

  sendSuccess(res, result, 'Import completed')
})
