import { AuditItemStatus, ItemStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/error'

export const getSummary = async () => {
  const [totalActive, totalReleased, totalCustomers, totalAudits] = await Promise.all([
    prisma.item.count({ where: { status: ItemStatus.ACTIVE } }),
    prisma.item.count({ where: { status: ItemStatus.RELEASED } }),
    prisma.customer.count(),
    prisma.audit.count()
  ])

  const lastAudit = await prisma.audit.findFirst({
    where: { finalizedAt: { not: null } },
    orderBy: { finalizedAt: 'desc' },
    select: { id: true, finalizedAt: true, totalItemsAtTime: true }
  })

  const itemsByType = await prisma.item.groupBy({
    by: ['itemType'],
    where: { status: ItemStatus.ACTIVE },
    _count: { id: true },
    _sum: { weight: true }
  })

  return {
    inventory: { totalActive, totalReleased, totalItems: totalActive + totalReleased },
    customers: totalCustomers,
    audits: totalAudits,
    lastAudit,
    breakdownByType: itemsByType.map(row => ({
      itemType: row.itemType,
      count: row._count.id,
      totalWeight: row._sum.weight
    }))
  }
}

export const getMissingItems = async () => {
  // Items flagged MISSING in the most recent finalized audit
  const lastAudit = await prisma.audit.findFirst({
    where: { finalizedAt: { not: null } },
    orderBy: { finalizedAt: 'desc' },
    select: { id: true, finalizedAt: true }
  })

  if (!lastAudit) return { auditId: null, finalizedAt: null, missingItems: [] }

  const missingAuditItems = await prisma.auditItem.findMany({
    where: { auditId: lastAudit.id, status: AuditItemStatus.MISSING },
    include: {
      item: {
        include: { customer: { select: { id: true, name: true, nic: true, phone: true } } }
      }
    }
  })

  return {
    auditId: lastAudit.id,
    finalizedAt: lastAudit.finalizedAt,
    missingItems: missingAuditItems
  }
}

export const getCustomerHistory = async (customerId: string) => {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      items: {
        orderBy: { pawnDate: 'desc' },
        include: {
          release: {
            include: { releasedBy: { select: { id: true, name: true } } }
          },
          barcodeLogs: {
            orderBy: { scannedAt: 'desc' },
            include: { scannedBy: { select: { id: true, name: true } } }
          }
        }
      }
    }
  })

  if (!customer) throw new AppError('Customer not found', 404)

  const activeCount = customer.items.filter(i => i.status === ItemStatus.ACTIVE).length
  const releasedCount = customer.items.filter(i => i.status === ItemStatus.RELEASED).length

  return { customer, summary: { activeCount, releasedCount, totalItems: customer.items.length } }
}
