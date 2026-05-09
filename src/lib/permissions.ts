type Permission =
  | 'scripture'
  | 'blog'
  | 'study'
  | 'events'
  | 'gallery'
  | 'forms'
  | 'members'
  | 'cms'
  | 'integrations'
  | 'automation'
  | 'partnership'
  | 'demo'
  | 'users'
  | 'activity'
  | 'delete'
  | 'finance'
  | 'prayer'
  | 'testimony'
  | 'messages'
  | 'faq'

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    'scripture',
    'blog',
    'study',
    'events',
    'gallery',
    'forms',
    'members',
    'cms',
    'integrations',
    'automation',
    'partnership',
    'demo',
    'users',
    'activity',
    'delete',
    'finance',
    'prayer',
    'testimony',
    'messages',
    'faq',
  ],
  ADMIN: [
    'scripture',
    'blog',
    'study',
    'events',
    'gallery',
    'forms',
    'members',
    'activity',
    'partnership',
    'prayer',
    'testimony',
    'messages',
    'faq',
  ],
  EDITOR: ['scripture', 'blog', 'study'],
  MEDIA_ADMIN: ['gallery'],
}

export function hasPermission(role: string, permission: Permission): boolean {
  if (role === 'SUPER_ADMIN') return true
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function canAccess(role: string, module: string): boolean {
  if (role === 'SUPER_ADMIN') return true
  if (module === 'dashboard' || module === '') return true
  const moduleMap: Record<string, Permission> = {
    scripture: 'scripture',
    blog: 'blog',
    study: 'study',
    events: 'events',
    gallery: 'gallery',
    forms: 'forms',
    members: 'members',
    cms: 'cms',
    integrations: 'integrations',
    automation: 'automation',
    partner: 'partnership',
    demo: 'demo',
    users: 'users',
    activity: 'activity',
    prayer: 'prayer',
    testimonies: 'testimony',
    messages: 'messages',
    faq: 'faq',
  }
  const permission = moduleMap[module]
  if (!permission) return false
  return hasPermission(role, permission)
}
