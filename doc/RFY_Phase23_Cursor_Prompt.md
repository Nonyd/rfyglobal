# ROOM FOR YOU — Phase 23 Cursor Prompt
## Bulk Actions + Multi-Select Across All Admin List Pages

---

## CONTEXT

Every admin page that shows a list of items needs bulk selection and bulk actions. This reduces the work of managing large lists — instead of deleting/approving/rejecting one item at a time, admin can select many and act on all at once.

**Pages to update:**
1. `/admin/members` — Members list
2. `/admin/prayer` — Prayer requests
3. `/admin/testimonies` — Testimonies
4. `/admin/events` — Events
5. `/admin/blog` — Blog posts
6. `/admin/scripture` — Scriptures
7. `/admin/gallery` — Gallery images (already has this — verify it's complete)
8. `/admin/forms` — Forms
9. `/admin/messages` — Message threads
10. `/admin/activity` — Activity log

---

## SHARED PATTERN

Every list page follows the same pattern. Build this once as a reusable hook and floating action bar component, then apply to each page.

---

## TASK 1 — Reusable useBulkSelect Hook

Create `src/hooks/useBulkSelect.ts`:

```typescript
import { useState, useCallback } from 'react'

export function useBulkSelect<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(i => i.id)))
  }, [items])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds])

  const isAllSelected = items.length > 0 && selectedIds.size === items.length
  const isPartialSelected = selectedIds.size > 0 && selectedIds.size < items.length

  const selectedCount = selectedIds.size
  const selectedArray = Array.from(selectedIds)

  const reset = useCallback(() => setSelectedIds(new Set()), [])

  return {
    selectedIds,
    selectedArray,
    selectedCount,
    toggle,
    selectAll,
    deselectAll,
    isSelected,
    isAllSelected,
    isPartialSelected,
    reset,
  }
}
```

---

## TASK 2 — Reusable BulkActionBar Component

Create `src/components/admin/shared/BulkActionBar.tsx`:

```typescript
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, X, CheckSquare } from 'lucide-react'

interface BulkAction {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'danger' | 'primary' | 'default'
  disabled?: boolean
}

interface BulkActionBarProps {
  selectedCount: number
  onDeselectAll: () => void
  onSelectAll: () => void
  isAllSelected: boolean
  totalCount: number
  actions: BulkAction[]
}

export function BulkActionBar({
  selectedCount,
  onDeselectAll,
  onSelectAll,
  isAllSelected,
  totalCount,
  actions,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-6 left-1/2 z-50 flex items-center gap-3 px-5 py-3 shadow-2xl"
        style={{
          transform: 'translateX(-50%)',
          background: 'var(--a-surface)',
          border: '1px solid var(--a-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          minWidth: '400px',
        }}
      >
        {/* Count */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-5 h-5 flex items-center justify-center rounded-sm"
            style={{ background: 'var(--a-gold)', color: '#0F0F0F' }}>
            <span className="text-[10px] font-bold">{selectedCount}</span>
          </div>
          <p className="font-body text-sm font-medium" style={{ color: 'var(--a-text)' }}>
            {selectedCount === 1 ? '1 item' : `${selectedCount} items`} selected
          </p>
        </div>

        {/* Select all toggle */}
        {!isAllSelected && (
          <button
            onClick={onSelectAll}
            className="font-body text-xs transition-colors shrink-0"
            style={{ color: 'var(--a-gold)' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Select all {totalCount}
          </button>
        )}

        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              disabled={action.disabled}
              className="flex items-center gap-1.5 px-3 py-2 font-body text-xs font-medium transition-all disabled:opacity-40"
              style={{
                background: action.variant === 'danger'
                  ? 'rgba(239,68,68,0.15)'
                  : action.variant === 'primary'
                  ? 'var(--a-gold)'
                  : 'var(--a-bg)',
                color: action.variant === 'danger'
                  ? '#F87171'
                  : action.variant === 'primary'
                  ? '#0F0F0F'
                  : 'var(--a-text-secondary)',
                border: `1px solid ${
                  action.variant === 'danger'
                    ? 'rgba(239,68,68,0.3)'
                    : action.variant === 'primary'
                    ? 'transparent'
                    : 'var(--a-border)'
                }`,
              }}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>

        {/* Deselect */}
        <button
          onClick={onDeselectAll}
          className="ml-1 p-1.5 transition-colors shrink-0"
          style={{ color: 'var(--a-text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--a-text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--a-text-muted)')}
        >
          <X size={16} />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
```

---

## TASK 3 — Reusable SelectCheckbox Component

Create `src/components/admin/shared/SelectCheckbox.tsx`:

```typescript
'use client'

interface SelectCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  size?: 'sm' | 'md'
}

export function SelectCheckbox({ checked, onChange, size = 'md' }: SelectCheckboxProps) {
  const dim = size === 'sm' ? 16 : 18

  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onChange(!checked) }}
      className="shrink-0 flex items-center justify-center transition-all"
      style={{
        width: `${dim}px`,
        height: `${dim}px`,
        background: checked ? 'var(--a-gold)' : 'transparent',
        border: `2px solid ${checked ? 'var(--a-gold)' : 'var(--a-border-strong)'}`,
        borderRadius: '2px',
      }}
      onMouseEnter={e => {
        if (!checked) e.currentTarget.style.borderColor = 'var(--a-gold)'
      }}
      onMouseLeave={e => {
        if (!checked) e.currentTarget.style.borderColor = 'var(--a-border-strong)'
      }}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="#0F0F0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  )
}
```

---

## TASK 4 — Apply to Members Manager

Open `src/components/admin/members/MembersManager.tsx`.

```typescript
import { useBulkSelect } from '@/hooks/useBulkSelect'
import { BulkActionBar } from '@/components/admin/shared/BulkActionBar'
import { SelectCheckbox } from '@/components/admin/shared/SelectCheckbox'
import { Trash2, Mail } from 'lucide-react'

// Inside component:
const bulk = useBulkSelect(members)

const bulkDelete = async () => {
  if (!confirm(`Delete ${bulk.selectedCount} member${bulk.selectedCount > 1 ? 's' : ''}? This cannot be undone.`)) return
  const res = await fetch('/api/join/bulk-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: bulk.selectedArray }),
  })
  if (res.ok) {
    toast.success(`${bulk.selectedCount} members deleted`)
    bulk.reset()
    await loadMembers()
  } else {
    toast.error('Failed to delete members')
  }
}

// Add select-all header checkbox to the table header row:
<th style={{ width: '40px' }}>
  <SelectCheckbox
    checked={bulk.isAllSelected}
    onChange={v => v ? bulk.selectAll() : bulk.deselectAll()}
  />
</th>

// Add checkbox to each member row:
<td>
  <SelectCheckbox
    checked={bulk.isSelected(member.id)}
    onChange={() => bulk.toggle(member.id)}
  />
</td>

// Add BulkActionBar:
<BulkActionBar
  selectedCount={bulk.selectedCount}
  onDeselectAll={bulk.deselectAll}
  onSelectAll={bulk.selectAll}
  isAllSelected={bulk.isAllSelected}
  totalCount={members.length}
  actions={[
    {
      label: 'Delete',
      icon: <Trash2 size={12} />,
      onClick: bulkDelete,
      variant: 'danger',
    },
  ]}
/>
```

Also create `src/app/api/join/bulk-delete/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ids } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
  }

  const result = await db.communityMember.deleteMany({
    where: { id: { in: ids } },
  })

  return NextResponse.json({ deleted: result.count })
}
```

---

## TASK 5 — Apply to Prayer Manager

Open `src/components/admin/prayer/PrayerManager.tsx`.

```typescript
const bulk = useBulkSelect(filteredRequests)

const bulkDelete = async () => {
  if (!confirm(`Delete ${bulk.selectedCount} prayer request${bulk.selectedCount > 1 ? 's' : ''}?`)) return
  await Promise.all(
    bulk.selectedArray.map(id =>
      fetch(`/api/admin/prayer/${id}`, { method: 'DELETE' })
    )
  )
  toast.success(`${bulk.selectedCount} requests deleted`)
  bulk.reset()
  await loadRequests()
}

const bulkMarkPrayed = async () => {
  await Promise.all(
    bulk.selectedArray.map(id =>
      fetch(`/api/admin/prayer/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PRAYED' }),
      })
    )
  )
  toast.success(`${bulk.selectedCount} requests marked as prayed`)
  bulk.reset()
  await loadRequests()
}

// Add SelectCheckbox to each request card
// Add BulkActionBar with:
actions={[
  {
    label: 'Mark Prayed',
    icon: <span>🙏</span>,
    onClick: bulkMarkPrayed,
    variant: 'primary',
  },
  {
    label: 'Delete',
    icon: <Trash2 size={12} />,
    onClick: bulkDelete,
    variant: 'danger',
  },
]}
```

---

## TASK 6 — Apply to Testimony Manager

Open `src/components/admin/testimony/TestimonyManager.tsx`.

```typescript
const bulk = useBulkSelect(filteredTestimonies)

const bulkApprove = async () => {
  await Promise.all(
    bulk.selectedArray.map(id =>
      fetch(`/api/admin/testimony/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      })
    )
  )
  toast.success(`${bulk.selectedCount} testimonies approved`)
  bulk.reset()
  await loadTestimonies()
}

const bulkReject = async () => {
  if (!confirm(`Reject ${bulk.selectedCount} testimonies?`)) return
  await Promise.all(
    bulk.selectedArray.map(id =>
      fetch(`/api/admin/testimony/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      })
    )
  )
  toast.success(`${bulk.selectedCount} testimonies rejected`)
  bulk.reset()
  await loadTestimonies()
}

const bulkDelete = async () => {
  if (!confirm(`Delete ${bulk.selectedCount} testimonies?`)) return
  await Promise.all(
    bulk.selectedArray.map(id =>
      fetch(`/api/admin/testimony/${id}`, { method: 'DELETE' })
    )
  )
  toast.success(`${bulk.selectedCount} testimonies deleted`)
  bulk.reset()
  await loadTestimonies()
}

// BulkActionBar actions based on current tab:
actions={[
  ...(activeTab === 'PENDING' ? [
    { label: 'Approve All', onClick: bulkApprove, variant: 'primary' as const },
    { label: 'Reject All', onClick: bulkReject, variant: 'default' as const },
  ] : []),
  { label: 'Delete', icon: <Trash2 size={12} />, onClick: bulkDelete, variant: 'danger' as const },
]}
```

---

## TASK 7 — Apply to Events Manager

Open `src/components/admin/events/EventsManager.tsx`.

```typescript
const bulk = useBulkSelect(events)

const bulkDelete = async () => {
  if (!confirm(`Delete ${bulk.selectedCount} event${bulk.selectedCount > 1 ? 's' : ''}?`)) return
  await Promise.all(
    bulk.selectedArray.map(id =>
      fetch(`/api/events/${id}`, { method: 'DELETE' })
    )
  )
  toast.success(`${bulk.selectedCount} events deleted`)
  bulk.reset()
  await loadEvents()
}

// BulkActionBar:
actions={[
  { label: 'Delete', icon: <Trash2 size={12} />, onClick: bulkDelete, variant: 'danger' },
]}
```

---

## TASK 8 — Apply to Blog Manager

Open `src/components/admin/blog/BlogManager.tsx` or `PostsManager.tsx`.

```typescript
const bulk = useBulkSelect(posts)

const bulkDelete = async () => {
  if (!confirm(`Delete ${bulk.selectedCount} post${bulk.selectedCount > 1 ? 's' : ''}?`)) return
  await Promise.all(
    bulk.selectedArray.map(id =>
      fetch(`/api/blog/${id}`, { method: 'DELETE' })
    )
  )
  toast.success(`${bulk.selectedCount} posts deleted`)
  bulk.reset()
  await loadPosts()
}

const bulkPublish = async () => {
  await Promise.all(
    bulk.selectedArray.map(id =>
      fetch(`/api/blog/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: true }),
      })
    )
  )
  toast.success(`${bulk.selectedCount} posts published`)
  bulk.reset()
  await loadPosts()
}

const bulkUnpublish = async () => {
  await Promise.all(
    bulk.selectedArray.map(id =>
      fetch(`/api/blog/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: false }),
      })
    )
  )
  toast.success(`${bulk.selectedCount} posts unpublished`)
  bulk.reset()
  await loadPosts()
}

// BulkActionBar:
actions={[
  { label: 'Publish', onClick: bulkPublish, variant: 'primary' },
  { label: 'Unpublish', onClick: bulkUnpublish, variant: 'default' },
  { label: 'Delete', icon: <Trash2 size={12} />, onClick: bulkDelete, variant: 'danger' },
]}
```

---

## TASK 9 — Apply to Scripture Manager

Open `src/components/admin/scripture/ScriptureManager.tsx`.

```typescript
const bulk = useBulkSelect(displayedScriptures)

const bulkDelete = async () => {
  if (!confirm(`Delete ${bulk.selectedCount} scripture${bulk.selectedCount > 1 ? 's' : ''}?`)) return
  await Promise.all(
    bulk.selectedArray.map(id =>
      fetch(`/api/scripture/${id}`, { method: 'DELETE' })
    )
  )
  toast.success(`${bulk.selectedCount} scriptures deleted`)
  bulk.reset()
  await loadScriptures()
}

const bulkPublish = async () => {
  await Promise.all(
    bulk.selectedArray.map(id =>
      fetch(`/api/scripture/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDraft: false, isActive: true }),
      })
    )
  )
  toast.success(`${bulk.selectedCount} scriptures published`)
  bulk.reset()
  await loadScriptures()
}

// In Drafts tab — show Publish action:
// In Published tab — show Delete only:
actions={[
  ...(tab === 'drafts' ? [
    { label: 'Publish All', onClick: bulkPublish, variant: 'primary' as const },
  ] : []),
  { label: 'Delete', icon: <Trash2 size={12} />, onClick: bulkDelete, variant: 'danger' as const },
]}
```

---

## TASK 10 — Apply to Forms Manager

Open the forms list component.

```typescript
const bulk = useBulkSelect(forms)

const bulkDelete = async () => {
  if (!confirm(`Delete ${bulk.selectedCount} form${bulk.selectedCount > 1 ? 's' : ''}?`)) return
  await Promise.all(
    bulk.selectedArray.map(id =>
      fetch(`/api/forms/${id}`, { method: 'DELETE' })
    )
  )
  toast.success(`${bulk.selectedCount} forms deleted`)
  bulk.reset()
  await loadForms()
}

// BulkActionBar:
actions={[
  { label: 'Delete', icon: <Trash2 size={12} />, onClick: bulkDelete, variant: 'danger' },
]}
```

---

## TASK 11 — Apply to Messages Manager

Open `src/components/admin/messaging/MessagingManager.tsx`.

```typescript
const bulk = useBulkSelect(threads)

const bulkDelete = async () => {
  if (!confirm(`Delete ${bulk.selectedCount} thread${bulk.selectedCount > 1 ? 's' : ''}?`)) return
  await Promise.all(
    bulk.selectedArray.map(id =>
      fetch(`/api/admin/messages/${id}`, { method: 'DELETE' })
    )
  )
  toast.success(`${bulk.selectedCount} threads deleted`)
  bulk.reset()
  await loadThreads()
}

const bulkMarkRead = async () => {
  await Promise.all(
    bulk.selectedArray.map(id =>
      fetch(`/api/admin/messages/${id}/read`, { method: 'POST' })
    )
  )
  toast.success(`${bulk.selectedCount} threads marked as read`)
  bulk.reset()
  await loadThreads()
}

// BulkActionBar:
actions={[
  { label: 'Mark Read', onClick: bulkMarkRead, variant: 'default' },
  { label: 'Delete', icon: <Trash2 size={12} />, onClick: bulkDelete, variant: 'danger' },
]}
```

Also add `DELETE` method to `src/app/api/admin/messages/[id]/route.ts`:

```typescript
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.messageThread.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
```

Also create `src/app/api/admin/messages/[id]/read/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.messageThread.update({
    where: { id: params.id },
    data: { isRead: true },
  })

  return NextResponse.json({ success: true })
}
```

---

## TASK 12 — Apply to Activity Log

Open the activity log component.

```typescript
const bulk = useBulkSelect(activities)

const bulkDelete = async () => {
  if (!confirm(`Delete ${bulk.selectedCount} activity log entries?`)) return
  // Call bulk delete API for activity logs
  const res = await fetch('/api/admin/activity/bulk-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: bulk.selectedArray }),
  })
  if (res.ok) {
    toast.success(`${bulk.selectedCount} entries deleted`)
    bulk.reset()
    await loadActivity()
  }
}

// Add clear all button separately as a non-bulk action:
// "Clear All Logs" button in the page header (SUPER_ADMIN only)
```

Create `src/app/api/admin/activity/bulk-delete/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/permissions'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(session.user.role, 'activity')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { ids } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
  }

  const result = await db.activityLog.deleteMany({
    where: { id: { in: ids } },
  })

  return NextResponse.json({ deleted: result.count })
}
```

---

## COMPLETION CHECKLIST

**Shared Infrastructure**
- [ ] `useBulkSelect` hook created and exported
- [ ] `BulkActionBar` component created — floats at bottom of screen
- [ ] `SelectCheckbox` component created

**Per-Page Implementation**
- [ ] Members — checkbox per row, select all header, bulk delete
- [ ] Prayer — checkbox per card, bulk mark prayed, bulk delete
- [ ] Testimonies — checkbox per card, bulk approve, bulk reject, bulk delete
- [ ] Events — checkbox per row/card, bulk delete
- [ ] Blog posts — checkbox per card, bulk publish, bulk unpublish, bulk delete
- [ ] Scriptures — checkbox per card, bulk publish (drafts), bulk delete
- [ ] Gallery — already has multi-select — verify it uses the new shared components
- [ ] Forms — checkbox per card, bulk delete
- [ ] Messages — checkbox per thread, bulk mark read, bulk delete
- [ ] Activity — checkbox per entry, bulk delete (SUPER_ADMIN only)

**UX Details**
- [ ] `BulkActionBar` appears with animation when items selected
- [ ] Count badge shows selected count
- [ ] "Select all X" link appears when not all selected
- [ ] Deselect X button closes the bar and resets selection
- [ ] After bulk action completes — bar disappears, list reloads
- [ ] Confirm dialog appears before destructive bulk actions

**APIs**
- [ ] `POST /api/join/bulk-delete` — members bulk delete
- [ ] `DELETE /api/admin/messages/[id]` — thread delete
- [ ] `POST /api/admin/messages/[id]/read` — mark read
- [ ] `POST /api/admin/activity/bulk-delete` — activity log bulk delete

**Build**
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The `useBulkSelect` hook takes `items` as a dependency for `selectAll`. When the items list changes (after filtering or reloading), call `bulk.reset()` to clear stale selections.
- The `BulkActionBar` uses `position: fixed; bottom: 6; left: 50%; transform: translateX(-50%)` — it floats centered above the page footer, same pattern as the gallery bulk delete bar.
- The `SelectCheckbox` stops event propagation on click — this prevents clicks on the checkbox from triggering the row's own click handler (e.g. opening an edit panel).
- For pages that show items in a card layout (prayer, testimonies, blog), place the checkbox in the top-left corner of each card, absolutely positioned, visible on hover OR always visible in select mode. Use the same hover-reveal pattern as the gallery.
- For pages that show items in a table layout (members, activity), add a checkbox column as the first column with a select-all header checkbox.
- The `isAllSelected` and `isPartialSelected` states allow showing an indeterminate checkbox state in the header when some but not all items are selected.
- Bulk API calls use `Promise.all` for parallelism — this is fine for typical admin list sizes (up to ~100 items). For larger lists, consider batching, but this is not needed for this use case.
- After any bulk action, always call `bulk.reset()` first, then reload data. This prevents stale IDs in the selection after the list changes.
