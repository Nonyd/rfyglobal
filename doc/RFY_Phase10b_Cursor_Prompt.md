# ROOM FOR YOU — Phase 10b Cursor Prompt
## Fix Admin 500 Error — Event Handlers in Server Component

---

## CONTEXT

The `/admin` dashboard home is crashing with a 500 error in production:

```
Error: Event handlers cannot be passed to Client Component props.
onMouseEnter: function onMouseEnter
```

The admin dashboard home (`src/app/admin/(dashboard)/page.tsx`) is a server component but contains `onMouseEnter` and `onMouseLeave` handlers on the quick action buttons. Event handlers cannot exist in server components — they must live in client components.

**Fix: extract the quick actions into a dedicated client component.**

---

## TASK 1 — Create QuickActions Client Component

Create `src/components/admin/QuickActions.tsx`:

```typescript
'use client'

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
        <a
          key={action.href}
          href={action.href}
          className="px-4 py-2.5 font-body text-sm font-medium border transition-all"
          style={{
            background: 'var(--admin-surface)',
            borderColor: 'var(--admin-border)',
            color: 'var(--admin-text-secondary)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--admin-gold)'
            e.currentTarget.style.color = 'var(--admin-gold)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--admin-border)'
            e.currentTarget.style.color = 'var(--admin-text-secondary)'
          }}
        >
          {action.label}
        </a>
      ))}
    </div>
  )
}
```

---

## TASK 2 — Update Admin Dashboard Home

Open `src/app/admin/(dashboard)/page.tsx`.

**Step 1 — Add the import:**
```typescript
import { QuickActions } from '@/components/admin/QuickActions'
```

**Step 2 — Find the quick actions section** — it looks like this (inline anchor tags with onMouseEnter/onMouseLeave):
```typescript
// REMOVE this entire block:
<div className="flex flex-wrap gap-3">
  {[
    { label: '+ New Scripture', href: '/admin/scripture' },
    { label: '+ New Post', href: '/admin/blog/new' },
    // ... etc
  ].map((action) => (
    <a
      key={action.href}
      href={action.href}
      onMouseEnter={...}
      onMouseLeave={...}
      ...
    >
      {action.label}
    </a>
  ))}
</div>
```

**Step 3 — Replace with:**
```typescript
<QuickActions />
```

---

## TASK 3 — Audit for Other Event Handlers in Server Components

While fixing the above, scan `src/app/admin/(dashboard)/page.tsx` for any other inline event handlers (`onClick`, `onChange`, `onMouseEnter`, `onMouseLeave`, `onFocus`, `onBlur`) that may exist directly in the server component file.

If any are found, apply the same pattern — extract them into a small `'use client'` component and import it.

---

## COMPLETION CHECKLIST

- [ ] `src/components/admin/QuickActions.tsx` created with `'use client'` directive
- [ ] Inline quick action buttons removed from `/admin/page.tsx`
- [ ] `<QuickActions />` imported and used in `/admin/page.tsx`
- [ ] No other event handlers remain in the server component
- [ ] `npm run build` completes without errors
- [ ] `/admin` loads without 500 error in production

---

## NOTES FOR CURSOR

- The root cause is that Next.js App Router server components cannot contain event handlers. Any interactivity must live in a component marked `'use client'`.
- The `page.tsx` file fetches DB data server-side — keep all DB calls there. Only the interactive parts (hover handlers) move to the client component.
- This is a one-file fix. Do not restructure the dashboard page beyond extracting the quick actions.
