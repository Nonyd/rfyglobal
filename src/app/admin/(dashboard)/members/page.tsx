import { db } from '@/lib/db'
import { MembersManager } from '@/components/admin/members/MembersManager'

export const dynamic = 'force-dynamic'

export default async function MembersPage() {
  const [members, total, extraFields] = await Promise.all([
    db.communityMember.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    db.communityMember.count(),
    db.joinFormField.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    }),
  ])

  return <MembersManager initialMembers={members} total={total} extraFields={extraFields} />
}
