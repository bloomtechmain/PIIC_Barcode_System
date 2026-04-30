const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const items = await prisma.item.findMany({
    where: { ticketNo: null, description: { not: null } },
    select: { id: true, description: true }
  })

  let updated = 0
  for (const item of items) {
    const d = item.description || ''
    const ticketMatch = d.match(/Ticket No:\s*([^\s|]+)/)
    const grossMatch  = d.match(/Gross Wt:\s*([\d.]+)g/)
    const karatMatch  = d.match(/Karatage:\s*(\d+)K/)

    const ticketNo    = ticketMatch ? ticketMatch[1].trim() : null
    const grossWeight = grossMatch  ? parseFloat(grossMatch[1]) : null
    const karatage    = karatMatch  ? parseInt(karatMatch[1])   : null

    await prisma.item.update({
      where: { id: item.id },
      data: {
        ...(ticketNo                                    && { ticketNo }),
        ...(grossWeight && grossWeight > 0              && { grossWeight }),
        ...(karatage    && karatage > 0                 && { karatage }),
      }
    })
    updated++
  }
  console.log('Migrated', updated, 'items')
}

main().catch(console.error).finally(() => prisma.$disconnect())
