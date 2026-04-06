import { Response } from 'express'

export const sendSuccess = (
  res: Response,
  data: unknown,
  message = 'Success',
  statusCode = 200
) => {
  return res.status(statusCode).json({ success: true, message, data })
}

export const sendCreated = (res: Response, data: unknown, message = 'Created successfully') => {
  return sendSuccess(res, data, message, 201)
}

export const sendUnauthorized = (res: Response, message = 'Unauthorized') => {
  return res.status(401).json({ success: false, message, data: null })
}

export const sendForbidden = (res: Response, message = 'Forbidden') => {
  return res.status(403).json({ success: false, message, data: null })
}

export const sendNotFound = (res: Response, message = 'Not found') => {
  return res.status(404).json({ success: false, message, data: null })
}

export const sendBadRequest = (res: Response, message: string) => {
  return res.status(400).json({ success: false, message, data: null })
}

export const sendConflict = (res: Response, message: string) => {
  return res.status(409).json({ success: false, message, data: null })
}
