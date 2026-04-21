import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'

export interface LogActivityInput {
  userId?: string | null
  action: string
  entity?: string
  entityId?: string
  details?: Record<string, unknown>
  ip?: string
}

export const logActivity = async (data: LogActivityInput) => {
  await prisma.activityLog.create({
    data: {
      userId: data.userId ?? undefined,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      details: data.details as Prisma.InputJsonValue | undefined,
      ip: data.ip
    }
  })
}

export interface GetActivityLogsFilter {
  userId?: string
  action?: string
  entity?: string
  search?: string // searches user name
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export const getActivityLogs = async (filter: GetActivityLogsFilter) => {
  const page = Math.max(1, filter.page ?? 1)
  const limit = Math.min(100, Math.max(1, filter.limit ?? 20))
  const skip = (page - 1) * limit

  const where: Prisma.ActivityLogWhereInput = {}

  if (filter.userId) where.userId = filter.userId
  if (filter.action) where.action = { contains: filter.action, mode: 'insensitive' }
  if (filter.entity) where.entity = filter.entity
  if (filter.dateFrom || filter.dateTo) {
    where.createdAt = {}
    if (filter.dateFrom) where.createdAt.gte = new Date(filter.dateFrom)
    if (filter.dateTo) {
      const to = new Date(filter.dateTo)
      to.setHours(23, 59, 59, 999)
      where.createdAt.lte = to
    }
  }
  if (filter.search) {
    where.user = { name: { contains: filter.search, mode: 'insensitive' } }
  }

  const [total, items] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      }
    })
  ])

  return {
    items,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  }
}
