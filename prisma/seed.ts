import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const passwordHash = await bcrypt.hash('Admin@123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@goldpawn.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@goldpawn.com',
      passwordHash,
      role: Role.ADMIN
    }
  })

  console.log(`Admin user created: ${admin.email}`)
  console.log('Default credentials → email: admin@goldpawn.com | password: Admin@123')

  const superPasswordHash = await bcrypt.hash('SuperAdmin@123', 12)

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@goldpawn.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@goldpawn.com',
      passwordHash: superPasswordHash,
      role: Role.SUPER_ADMIN
    }
  })

  console.log(`Super admin user created: ${superAdmin.email}`)
  console.log('Default credentials → email: superadmin@goldpawn.com | password: SuperAdmin@123')
  console.log('Change the password after first login.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
