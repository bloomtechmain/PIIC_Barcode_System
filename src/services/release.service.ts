import { ItemStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/error'
import { CreateReleaseInput } from '../validators/release.validator'

export const create = async (data: CreateReleaseInput, releasedById: string) => {
  const item = await prisma.item.findUnique({ where: { id: data.itemId } })
  if (!item) throw new AppError('Item not found', 404)
  if (item.status === ItemStatus.RELEASED) {
    throw new AppError('Item has already been released', 409)
  }

  return prisma.$transaction(async tx => {
    const release = await tx.release.create({
      data: {
        itemId: data.itemId,
        releasedById,
        notes: data.notes
      },
      include: {
        item: { include: { customer: { select: { id: true, name: true } } } },
        releasedBy: { select: { id: true, name: true } }
      }
    })

    await tx.item.update({
      where: { id: data.itemId },
      data: { status: ItemStatus.RELEASED }
    })

    return release
  })
}

export const findAll = async () => {
  return prisma.release.findMany({
    orderBy: { releaseDate: 'desc' },
    include: {
      item: {
        include: { customer: { select: { id: true, name: true, nic: true } } }
      },
      releasedBy: { select: { id: true, name: true } }
    }
  })
}

export const findById = async (id: string) => {
  const release = await prisma.release.findUnique({
    where: { id },
    include: {
      item: { include: { customer: true } },
      releasedBy: { select: { id: true, name: true } }
    }
  })
  if (!release) throw new AppError('Release record not found', 404)
  return release
}
