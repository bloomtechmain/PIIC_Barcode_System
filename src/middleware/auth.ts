import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import { sendUnauthorized } from '../utils/response'

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    sendUnauthorized(res, 'No token provided')
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = verifyToken(token)
    req.user = payload
    next()
  } catch {
    sendUnauthorized(res, 'Invalid or expired token')
  }
}
