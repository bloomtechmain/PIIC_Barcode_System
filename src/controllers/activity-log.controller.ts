import { Request, Response } from 'express'
import * as activityLogService from '../services/activity-log.service'
import { sendSuccess } from '../utils/response'
import { asyncHandler } from '../utils/async-handler'

export const getLogs = asyncHandler(async (req: Request, res: Response) => {
  const { userId, action, entity, search, dateFrom, dateTo, page, limit } = req.query

  const result = await activityLogService.getActivityLogs({
    userId: userId as string | undefined,
    action: action as string | undefined,
    entity: entity as string | undefined,
    search: search as string | undefined,
    dateFrom: dateFrom as string | undefined,
    dateTo: dateTo as string | undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined
  })

  sendSuccess(res, result)
})
