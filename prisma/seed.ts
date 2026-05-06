import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment')
    process.exit(1)
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`Admin user ${email} already exists - skipping`)
    return
  }

  const hashed = await bcrypt.hash(password, 12)
  const user = await db.user.create({
    data: { email, password: hashed, name: 'Admin', role: 'ADMIN' },
  })

  console.log(`Admin user created: ${user.email}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
