'use client'

import Link from 'next/link'

const ACTIONS = [
  { label: '+ New Scripture', href: '/admin/scripture' },
  { label: '+ New Post', href: '/admin/blog/new' },
  { label: '+ New Event', href: '/admin/events' },
  { label: '+ Upload Photos', href: '/admin/gallery' },
  { label: '+ New Form', href: '/admin/forms/new' },
  { label: 'View Partners', href: '/admin/partner' },
]

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      {ACTIONS.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="px-4 py-2.5 font-body text-sm font-medium border transition-all"
          style={{
            background: 'var(--a-surface)',
            borderColor: 'var(--a-border)',
            color: 'var(--a-text-secondary)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--a-gold)'
            e.currentTarget.style.color = 'var(--a-gold)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--a-border)'
            e.currentTarget.style.color = 'var(--a-text-secondary)'
          }}
        >
          {action.label}
        </Link>
      ))}
    </div>
  )
}
