import { AuditItemStatus, ItemStatus, ScanType } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/error'
import { CreateAuditInput, UpdateAuditItemInput, BulkReleaseInput } from '../validators/audit.validator'
import { logActivity } from './activity-log.service'

export const create = async (data: CreateAuditInput, createdById: string) => {
  const totalItemsAtTime = await prisma.item.count({
    where: { status: ItemStatus.ACTIVE }
  })

  const audit = await prisma.audit.create({
    data: {
      createdById,
      totalItemsAtTime,
      notes: data.notes
    },
    include: {
      createdBy: { select: { id: true, name: true } }
    }
  })
  await logActivity({ userId: createdById, action: 'AUDIT_CREATE', entity: 'Audit', entityId: audit.id, details: { totalItemsAtTime } })
  return audit
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
      include: {
        item: {
          select: {
            id: true,
            itemType: true,
            weight: true,
            status: true,
            customer: { select: { id: true, name: true } }
          }
        }
      }
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

export const finalizeAudit = async (auditId: string, userId: string) => {
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

  const summary = {
    auditId,
    totalActive: activeItems.length,
    scanned: audit._count.auditItems,
    found: foundBarcodes.size,
    missing: missingItems.length,
    finalizedAt: new Date()
  }
  await logActivity({ userId, action: 'AUDIT_FINALIZE', entity: 'Audit', entityId: auditId, details: { found: summary.found, missing: summary.missing, scanned: summary.scanned } })
  return summary
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
              description: true,
              status: true,
              customer: { select: { id: true, name: true } },
              itemCorrections: {
                orderBy: { correctedAt: 'desc' },
                include: { correctedBy: { select: { id: true, name: true } },
                            audit: { select: { id: true, createdAt: true } } }
              }
            }
          },
          corrections: {
            orderBy: { correctedAt: 'asc' },
            include: { correctedBy: { select: { id: true, name: true } } }
          }
        }
      }
    }
  })
  if (!audit) throw new AppError('Audit not found', 404)
  return audit
}

export const updateAuditItem = async (
  auditId: string,
  auditItemId: string,
  data: UpdateAuditItemInput,
  userId: string
) => {
  const auditItem = await prisma.auditItem.findUnique({
    where: { id: auditItemId },
    include: { item: true }
  })
  if (!auditItem) throw new AppError('Audit item not found', 404)
  if (auditItem.auditId !== auditId) throw new AppError('Audit item does not belong to this audit', 400)

  return prisma.$transaction(async tx => {
    // Save remarks
    const updated = await tx.auditItem.update({
      where: { id: auditItemId },
      data: { remarks: data.remarks ?? auditItem.remarks }
    })

    // Apply corrections if item exists
    if (data.corrections?.length && auditItem.item) {
      const item = auditItem.item
      const updateData: Record<string, string> = {}

      for (const c of data.corrections) {
        const oldValue = String(item[c.field as keyof typeof item] ?? '')
        await tx.itemCorrection.create({
          data: {
            itemId: item.id,
            auditId,
            auditItemId,
            field: c.field,
            oldValue,
            newValue: c.newValue,
            correctedById: userId
          }
        })
        updateData[c.field] = c.newValue
      }

      await tx.item.update({ where: { id: item.id }, data: updateData })
    }

    const hasCorrections = (data.corrections?.length ?? 0) > 0
    const action = hasCorrections ? 'AUDIT_ITEM_CORRECTION' : 'AUDIT_ITEM_REMARK'
    await logActivity({ userId, action, entity: 'AuditItem', entityId: auditItemId, details: { auditId, remarks: data.remarks, corrections: data.corrections } })
    return updated
  })
}

export const bulkRelease = async (
  auditId: string,
  data: BulkReleaseInput,
  releasedById: string
) => {
  const audit = await prisma.audit.findUnique({ where: { id: auditId } })
  if (!audit) throw new AppError('Audit not found', 404)
  if (!audit.finalizedAt) throw new AppError('Audit must be finalized before releasing items', 400)

  // Load all requested items in one query
  const items = await prisma.item.findMany({
    where: { id: { in: data.itemIds } },
    include: { customer: { select: { id: true, name: true, nic: true } } }
  })

  const itemMap = new Map(items.map(i => [i.id, i]))
  const skipped: string[] = []
  const toRelease = data.itemIds.filter(id => {
    const item = itemMap.get(id)
    if (!item || item.status === ItemStatus.RELEASED) {
      skipped.push(id)
      return false
    }
    return true
  })

  if (!toRelease.length) throw new AppError('All selected items are already released', 409)

  const released = await prisma.$transaction(async tx => {
    const results = []
    for (const itemId of toRelease) {
      const release = await tx.release.create({
        data: { itemId, releasedById, notes: data.notes },
        include: {
          item: {
            include: { customer: { select: { id: true, name: true, nic: true } } }
          },
          releasedBy: { select: { id: true, name: true } }
        }
      })
      await tx.item.update({
        where: { id: itemId },
        data: { status: ItemStatus.RELEASED }
      })
      results.push(release)
    }
    return results
  })

  await logActivity({ userId: releasedById, action: 'BULK_RELEASE', entity: 'Audit', entityId: auditId, details: { released: released.length, skipped: skipped.length, notes: data.notes } })
  return { released: released.length, skipped: skipped.length, releases: released }
}
