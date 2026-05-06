import { db } from '@/lib/db'
import { eventSlug } from '@/lib/utils'

export async function ensureUniqueEventSlug(base: string, excludeEventId?: string) {
  let candidate = base
  for (let attempt = 0; attempt < 50; attempt++) {
    const existing = await db.event.findFirst({
      where: {
        slug: candidate,
        ...(excludeEventId ? { NOT: { id: excludeEventId } } : {}),
      },
    })
    if (!existing) return candidate
    candidate = `${base}-${Date.now()}-${attempt}`
  }
  return `${base}-${excludeEventId ?? 'event'}`
}

export async function slugFromTitleCity(title: string, city: string, excludeEventId?: string) {
  const base = eventSlug(title, city)
  return ensureUniqueEventSlug(base, excludeEventId)
}

function isLikelyCuid(s: string) {
  return /^c[a-z0-9]{24}$/i.test(s)
}

export function eventLookupWhere(param: string) {
  if (isLikelyCuid(param)) {
    return { id: param, isActive: true } as const
  }
  return { slug: param, isActive: true } as const
}
