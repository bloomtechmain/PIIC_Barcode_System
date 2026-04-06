import jwt from 'jsonwebtoken'
import { Role } from '@prisma/client'

export interface JwtPayload {
  userId: string
  email: string
  role: Role
}

export const signToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not defined')

  return jwt.sign(payload, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as `${number}${'s'|'m'|'h'|'d'|'w'}`
  })
}

export const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not defined')

  return jwt.verify(token, secret) as JwtPayload
}
