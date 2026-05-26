import { db } from '@/lib/db'
import { BROADCAST_GROUP_LABELS } from '@/lib/broadcast-constants'

export type BroadcastRecipient = { email: string; name: string }

export async function getBroadcastRecipients(
  group: string,
  groupFilter?: string,
): Promise<BroadcastRecipient[]> {
  switch (group) {
    case 'all_members': {
      const members = await db.communityMember.findMany({
        where: { email: { not: '' }, isSubscribed: true },
        select: { email: true, name: true },
      })
      return dedupeRecipients(members)
    }

    case 'event_registrants': {
      const registrations = await db.eventRegistration.findMany({
        where: groupFilter ? { eventId: groupFilter } : {},
        select: { email: true, name: true },
      })
      return dedupeRecipients(registrations)
    }

    case 'prayer_requesters': {
      const prayers = await db.prayerRequest.findMany({
        select: { email: true, name: true },
      })
      return dedupeRecipients(
        prayers.map((p) => ({ email: p.email, name: p.name ?? 'Friend' })),
      )
    }

    case 'testimony_submitters': {
      const testimonies = await db.testimony.findMany({
        select: { email: true, name: true },
      })
      return dedupeRecipients(
        testimonies.map((t) => ({ email: t.email, name: t.name ?? 'Friend' })),
      )
    }

    case 'form_submitters': {
      if (!groupFilter) return []
      const form = await db.form.findUnique({
        where: { id: groupFilter },
        include: {
          fields: true,
          submissions: { include: { values: true } },
        },
      })
      if (!form) return []

      const fieldTypeById = new Map(form.fields.map((f) => [f.id, f.type]))
      const recipients: BroadcastRecipient[] = []
      const seen = new Set<string>()

      for (const submission of form.submissions) {
        const emailValue = submission.values.find(
          (v) => fieldTypeById.get(v.fieldId) === 'EMAIL',
        )
        const nameValue = submission.values.find((v) =>
          v.fieldLabel.toLowerCase().includes('name'),
        )
        const email = emailValue?.value?.trim()
        if (email && !seen.has(email.toLowerCase())) {
          seen.add(email.toLowerCase())
          recipients.push({
            email,
            name: nameValue?.value?.trim() || 'Friend',
          })
        }
      }

      return recipients
    }

    default:
      return []
  }
}

function dedupeRecipients(
  rows: { email: string; name: string | null }[],
): BroadcastRecipient[] {
  const seen = new Set<string>()
  const out: BroadcastRecipient[] = []
  for (const row of rows) {
    const email = row.email?.trim()
    if (!email) continue
    const key = email.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ email, name: row.name?.trim() || 'Friend' })
  }
  return out
}

export { BROADCAST_GROUP_LABELS }
