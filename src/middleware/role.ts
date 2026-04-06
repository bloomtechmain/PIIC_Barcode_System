import { Request, Response, NextFunction } from 'express'
import { Role } from '@prisma/client'
import { sendForbidden } from '../utils/response'

export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      sendForbidden(res, 'Insufficient permissions')
      return
    }
    next()
  }
}
