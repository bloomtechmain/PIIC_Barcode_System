import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/error'
import { CreateCustomerInput, UpdateCustomerInput } from '../validators/customer.validator'

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

export const create = async (data: CreateCustomerInput) => {
  const existing = await prisma.customer.findUnique({ where: { nic: data.nic } })
  if (existing) throw new AppError('A customer with this NIC already exists', 409)

  return prisma.customer.create({ data })
}

export const update = async (id: string, data: UpdateCustomerInput) => {
  await findById(id) // ensure exists
  return prisma.customer.update({ where: { id }, data })
}
