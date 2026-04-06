import { ScanType } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/error'
import { generateBarcode } from '../utils/barcode-generator'
import {
  CreateItemInput,
  ItemFilterInput,
  UpdateItemInput
} from '../validators/item.validator'

const ITEM_DETAIL_INCLUDE = {
  customer: { select: { id: true, name: true, nic: true, phone: true } },
  release: { include: { releasedBy: { select: { id: true, name: true } } } },
  barcodeLogs: {
    orderBy: { scannedAt: 'desc' as const },
    take: 20,
    include: { scannedBy: { select: { id: true, name: true } } }
  }
}

export const findAll = async (filters: ItemFilterInput) => {
  const { status, customerId, page, limit } = filters
  const skip = (page - 1) * limit

  const where = {
    ...(status && { status }),
    ...(customerId && { customerId })
  }

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      skip,
      take: limit,
      orderBy: { pawnDate: 'desc' },
      include: {
        customer: { select: { id: true, name: true, nic: true } }
      }
    }),
    prisma.item.count({ where })
  ])

  return {
    items,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  }
}

export const findById = async (id: string) => {
  const item = await prisma.item.findUnique({
    where: { id },
    include: ITEM_DETAIL_INCLUDE
  })
  if (!item) throw new AppError('Item not found', 404)
  return item
}

export const findByBarcode = async (barcode: string) => {
  const item = await prisma.item.findUnique({
    where: { barcode },
    include: ITEM_DETAIL_INCLUDE
  })
  if (!item) throw new AppError('No item found with this barcode', 404)
  return item
}

export const create = async (data: CreateItemInput, createdById: string) => {
  // Validate a manually supplied barcode before entering the transaction
  if (data.barcode) {
    const clash = await prisma.item.findUnique({ where: { barcode: data.barcode } })
    if (clash) throw new AppError('Barcode already in use', 409)
  }

  return prisma.$transaction(async tx => {
    // Resolve barcode inside the transaction so the count is consistent
    let barcode = data.barcode

    if (!barcode) {
      const customer = await tx.customer.findUnique({
        where: { id: data.customerId },
        select: { name: true }
      })
      if (!customer) throw new AppError('Customer not found', 404)

      // Count ALL items for this customer (ACTIVE + RELEASED) — gives true pawn number
      const existingCount = await tx.item.count({
        where: { customerId: data.customerId }
      })

      // Next pawn number = existing + 1
      barcode = generateBarcode(customer.name, existingCount + 1)
    }

    const item = await tx.item.create({
      data: {
        barcode,
        customerId: data.customerId,
        itemType: data.itemType,
        weight: data.weight,
        description: data.description,
        pawnDate: data.pawnDate
      },
      include: {
        customer: { select: { id: true, name: true, nic: true } }
      }
    })

    await tx.barcodeLog.create({
      data: {
        itemId: item.id,
        scannedById: createdById,
        scanType: ScanType.CREATE
      }
    })

    return item
  })
}

export const update = async (id: string, data: UpdateItemInput) => {
  await findById(id) // ensure exists
  return prisma.item.update({
    where: { id },
    data,
    include: {
      customer: { select: { id: true, name: true, nic: true } }
    }
  })
}

export const verifyBarcode = async (barcode: string, scannedById: string) => {
  const item = await prisma.item.findUnique({
    where: { barcode },
    include: { customer: { select: { id: true, name: true } } }
  })

  if (item) {
    await prisma.barcodeLog.create({
      data: { itemId: item.id, scannedById, scanType: ScanType.VERIFY }
    })
  }

  return item
}
