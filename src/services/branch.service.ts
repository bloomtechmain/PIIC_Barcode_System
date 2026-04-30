import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/error'
import { CreateBranchInput, AssignCustomerInput } from '../validators/branch.validator'
import { logActivity } from './activity-log.service'

export const findAll = async () => {
  return prisma.branch.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { customers: true } } }
  })
}

export const findById = async (id: string) => {
  const branch = await prisma.branch.findUnique({
    where: { id },
    include: {
      customers: {
        include: {
          customer: {
            include: { _count: { select: { items: true } } }
          }
        }
      }
    }
  })
  if (!branch) throw new AppError('Branch not found', 404)
  return branch
}

export const create = async (data: CreateBranchInput, userId: string) => {
  const existing = await prisma.branch.findUnique({ where: { name: data.name } })
  if (existing) throw new AppError('A branch with this name already exists', 409)

  const branch = await prisma.branch.create({ data })
  await logActivity({ userId, action: 'BRANCH_CREATE', entity: 'Branch', entityId: branch.id, details: { name: branch.name } })
  return branch
}

export const remove = async (id: string, userId: string) => {
  const branch = await findById(id)
  await prisma.branch.delete({ where: { id } })
  await logActivity({ userId, action: 'BRANCH_DELETE', entity: 'Branch', entityId: id, details: { name: branch.name } })
}

export const assignCustomer = async (branchId: string, data: AssignCustomerInput, userId: string) => {
  await findById(branchId)

  const customer = await prisma.customer.findUnique({ where: { id: data.customerId } })
  if (!customer) throw new AppError('Customer not found', 404)

  const existing = await prisma.customerBranch.findUnique({
    where: { customerId_branchId: { customerId: data.customerId, branchId } }
  })
  if (existing) throw new AppError('Customer is already assigned to this branch', 409)

  await prisma.customerBranch.create({ data: { customerId: data.customerId, branchId } })
  await logActivity({ userId, action: 'BRANCH_ASSIGN_CUSTOMER', entity: 'Branch', entityId: branchId, details: { customerId: data.customerId, customerName: customer.name } })
}

export const removeCustomer = async (branchId: string, customerId: string, userId: string) => {
  await findById(branchId)

  const link = await prisma.customerBranch.findUnique({
    where: { customerId_branchId: { customerId, branchId } }
  })
  if (!link) throw new AppError('Customer is not assigned to this branch', 404)

  await prisma.customerBranch.delete({ where: { customerId_branchId: { customerId, branchId } } })
  await logActivity({ userId, action: 'BRANCH_REMOVE_CUSTOMER', entity: 'Branch', entityId: branchId, details: { customerId } })
}
