import { db } from '@/lib/db'

/** Resolve a community member by email (case-insensitive). */
export async function findCommunityMemberByEmail(email: string) {
  const normalized = email.trim()
  return db.communityMember.findFirst({
    where: { email: { equals: normalized, mode: 'insensitive' } },
    select: { id: true, name: true, email: true },
  })
}
