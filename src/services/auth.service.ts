import { Role } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/error'
import { comparePassword, hashPassword } from '../utils/hash'
import { signToken } from '../utils/jwt'
import { logActivity } from './activity-log.service'

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } })

  // Use the same error message for both cases to prevent user enumeration
  if (!user) throw new AppError('Invalid email or password', 401)

  const valid = await comparePassword(password, user.passwordHash)
  if (!valid) throw new AppError('Invalid email or password', 401)

  const token = signToken({ userId: user.id, email: user.email, role: user.role })

  await logActivity({ userId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id })

  const { passwordHash: _, ...userWithoutPassword } = user
  return { token, user: userWithoutPassword }
}

export const register = async (data: {
  name: string
  email: string
  password: string
  role: Role
}) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) throw new AppError('Email already in use', 409)

  const passwordHash = await hashPassword(data.password)

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  })

  await logActivity({ userId: user.id, action: 'USER_REGISTER', entity: 'User', entityId: user.id, details: { name: user.name, email: user.email, role: user.role } })
  return user
}

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  })
  if (!user) throw new AppError('User not found', 404)
  return user
}
