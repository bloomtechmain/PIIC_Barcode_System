import { Request, Response } from 'express'
import * as authService from '../services/auth.service'
import { loginSchema, registerSchema } from '../validators/auth.validator'
import { sendSuccess, sendCreated } from '../utils/response'
import { asyncHandler } from '../utils/async-handler'

export const login = asyncHandler(async (req: Request, res: Response) => {
  const body = loginSchema.parse(req.body)
  const result = await authService.login(body.email, body.password)
  sendSuccess(res, result, 'Login successful')
})

export const register = asyncHandler(async (req: Request, res: Response) => {
  const body = registerSchema.parse(req.body)
  const user = await authService.register(body)
  sendCreated(res, user, 'User registered successfully')
})

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getProfile(req.user!.userId)
  sendSuccess(res, user)
})
