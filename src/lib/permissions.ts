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
  | 'notifications'
  | 'email-templates'

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
    'notifications',
    'email-templates',
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
    'notifications',
    'email-templates',
  ],
  EDITOR: ['scripture', 'blog', 'study', 'notifications'],
  MEDIA_ADMIN: ['gallery', 'notifications'],
}

function normalizeRoleKey(role: string): string {
  const r = role.trim().toUpperCase().replace(/[\s-]+/g, '_')
  // JWT / UI drift: treat common variants as SUPER_ADMIN
  if (r === 'SUPERADMIN') return 'SUPER_ADMIN'
  return r
}

export function hasPermission(role: string, permission: Permission): boolean {
  const key = normalizeRoleKey(role || 'ADMIN')
  if (key === 'SUPER_ADMIN') return true
  return ROLE_PERMISSIONS[key]?.includes(permission) ?? false
}

export function canAccess(role: string, module: string): boolean {
  const key = normalizeRoleKey(role || 'ADMIN')
  if (key === 'SUPER_ADMIN') return true
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
    partnership: 'partnership',
    demo: 'demo',
    users: 'users',
    activity: 'activity',
    prayer: 'prayer',
    testimonies: 'testimony',
    messages: 'messages',
    faq: 'faq',
    notifications: 'notifications',
    'email-templates': 'email-templates',
  }
  const permission = moduleMap[module]
  if (!permission) return false
  return hasPermission(key, permission)
}
