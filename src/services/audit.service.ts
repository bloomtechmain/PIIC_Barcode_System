import { AuditItemStatus, ItemStatus, ScanType } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/error'
import { CreateAuditInput } from '../validators/audit.validator'

export const create = async (data: CreateAuditInput, createdById: string) => {
  const totalItemsAtTime = await prisma.item.count({
    where: { status: ItemStatus.ACTIVE }
  })

  return prisma.audit.create({
    data: {
      createdById,
      totalItemsAtTime,
      notes: data.notes
    },
    include: {
      createdBy: { select: { id: true, name: true } }
    }
  })
}

export const scanBarcode = async (
  auditId: string,
  barcode: string,
  scannedById: string
) => {
  const audit = await prisma.audit.findUnique({ where: { id: auditId } })
  if (!audit) throw new AppError('Audit not found', 404)
  if (audit.finalizedAt) throw new AppError('Audit has already been finalized', 409)

  // Prevent duplicate scans in the same audit (DB unique constraint is backup)
  const duplicate = await prisma.auditItem.findUnique({
    where: { auditId_barcode: { auditId, barcode } }
  })
  if (duplicate) throw new AppError('Barcode already scanned in this audit', 409)

  const item = await prisma.item.findUnique({ where: { barcode } })

  let status: AuditItemStatus
  let itemId: string | null = null

  if (!item) {
    // Barcode not in system at all
    status = AuditItemStatus.UNKNOWN
  } else if (item.status === ItemStatus.ACTIVE) {
    status = AuditItemStatus.FOUND
    itemId = item.id
  } else {
    // Released item found in vault — unexpected, treat as UNKNOWN
    status = AuditItemStatus.UNKNOWN
    itemId = item.id
  }

  return prisma.$transaction(async tx => {
    const auditItem = await tx.auditItem.create({
      data: { auditId, barcode, status, itemId },
      include: { item: { select: { id: true, itemType: true, weight: true } } }
    })

    // Log the scan if item is known
    if (item) {
      await tx.barcodeLog.create({
        data: { itemId: item.id, scannedById, scanType: ScanType.AUDIT }
      })
    }

    return auditItem
  })
}

export const finalizeAudit = async (auditId: string) => {
  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
    include: { _count: { select: { auditItems: true } } }
  })
  if (!audit) throw new AppError('Audit not found', 404)
  if (audit.finalizedAt) throw new AppError('Audit has already been finalized', 409)

  // All currently ACTIVE items
  const activeItems = await prisma.item.findMany({
    where: { status: ItemStatus.ACTIVE },
    select: { id: true, barcode: true }
  })

  // Barcodes scanned as FOUND in this audit
  const foundAuditItems = await prisma.auditItem.findMany({
    where: { auditId, status: AuditItemStatus.FOUND },
    select: { barcode: true }
  })
  const foundBarcodes = new Set(foundAuditItems.map(ai => ai.barcode))

  // Items not scanned at all = MISSING
  const missingItems = activeItems.filter(item => !foundBarcodes.has(item.barcode))

  await prisma.$transaction(async tx => {
    if (missingItems.length > 0) {
      await tx.auditItem.createMany({
        data: missingItems.map(item => ({
          auditId,
          barcode: item.barcode,
          status: AuditItemStatus.MISSING,
          itemId: item.id
        }))
      })
    }

    await tx.audit.update({
      where: { id: auditId },
      data: { finalizedAt: new Date() }
    })
  })

  return {
    auditId,
    totalActive: activeItems.length,
    scanned: audit._count.auditItems,
    found: foundBarcodes.size,
    missing: missingItems.length,
    finalizedAt: new Date()
  }
}

export const findAll = async () => {
  return prisma.audit.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { id: true, name: true } },
      _count: { select: { auditItems: true } }
    }
  })
}

export const findById = async (id: string) => {
  const audit = await prisma.audit.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true } },
      auditItems: {
        orderBy: { status: 'asc' },
        include: {
          item: {
            select: {
              id: true,
              barcode: true,
              itemType: true,
              weight: true,
              customer: { select: { id: true, name: true } }
            }
          }
        }
      }
    }
  })
  if (!audit) throw new AppError('Audit not found', 404)
  return audit
}
