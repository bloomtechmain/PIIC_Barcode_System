import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/error'
import { CreateCustomerInput, UpdateCustomerInput } from '../validators/customer.validator'
import { logActivity } from './activity-log.service'

export const findAll = async () => {
  return prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { items: true } }
    }
  })
}

export const findById = async (id: string) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { pawnDate: 'desc' },
        include: { release: true }
      }
    }
  })
  if (!customer) throw new AppError('Customer not found', 404)
  return customer
}

export const findByNic = async (nic: string) => {
  const customer = await prisma.customer.findUnique({ where: { nic } })
  if (!customer) throw new AppError('Customer not found', 404)
  return customer
}

export const create = async (data: CreateCustomerInput, userId: string) => {
  const existing = await prisma.customer.findUnique({ where: { nic: data.nic } })
  if (existing) throw new AppError('A customer with this NIC already exists', 409)

  const customer = await prisma.customer.create({ data })
  await logActivity({ userId, action: 'CUSTOMER_CREATE', entity: 'Customer', entityId: customer.id, details: { name: customer.name, nic: customer.nic } })
  return customer
}

export const update = async (id: string, data: UpdateCustomerInput, userId: string) => {
  await findById(id) // ensure exists
  const customer = await prisma.customer.update({ where: { id }, data })
  await logActivity({ userId, action: 'CUSTOMER_UPDATE', entity: 'Customer', entityId: id, details: data as Record<string, unknown> })
  return customer
}
