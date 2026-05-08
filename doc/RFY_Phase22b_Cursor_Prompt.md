# ROOM FOR YOU — Phase 22b Cursor Prompt
## Testimony Member Gate · Anonymous Email Privacy · Toggle Redesign · Testimony Fields

---

## CONTEXT

Four fixes from Phase 22 review:

1. **Testimony member gate** — Testimony submission must verify the email is a community member, same as prayer requests
2. **Anonymous prayer email privacy** — When a prayer request is anonymous, admin should NOT see the email address
3. **Toggle redesign** — All toggles across the site need a premium redesign
4. **Testimony additional fields** — Add location and phone number to testimony submission

---

## TASK 1 — Testimony Member Gate

Open `src/components/testimony/TestimonySubmitModal.tsx`.

The testimony form currently doesn't verify community membership. Add the same email verification pattern used in `PrayerWallClient`:

```typescript
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

// Add state:
const [notMember, setNotMember] = useState(false)

// Add email onChange handler:
onChange={e => {
  setForm(p => ({ ...p, email: e.target.value }))
  setNotMember(false) // reset error on change
}}

// Add notMember error display below email input:
<AnimatePresence>
  {notMember && (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-start gap-3 p-4 border mt-2"
      style={{ borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.06)' }}
    >
      <span className="text-red-400 shrink-0 mt-0.5">⚠</span>
      <div>
        <p className="font-body text-sm" style={{ color: '#FCA5A5' }}>
          This email is not registered with Room For You.
        </p>
        <p className="font-body text-xs mt-1" style={{ color: 'rgba(252,165,165,0.7)' }}>
          Please{' '}
          <Link href="/join" className="underline" style={{ color: '#C9A84C' }}>
            join the community
          </Link>
          {' '}first — it only takes a minute.
        </p>
      </div>
    </motion.div>
  )}
</AnimatePresence>

// In handleSubmit, handle the notMember response:
const data = await res.json()
if (!res.ok) {
  if (data.notMember) {
    setNotMember(true)
    return
  }
  throw new Error(data.error?.formErrors?.[0] ?? 'Submission failed')
}
```

Also update the email field label and hint:

```typescript
<label style={labelStyle}>Community Member Email *</label>
// hint text:
<p className="font-body text-xs mt-1" style={{ color: '#585858' }}>
  Must match the email you used to join Room For You.
</p>
```

Disable the submit button when `notMember` is true:

```typescript
disabled={submitting || notMember}
```

---

## TASK 2 — Add Location and Phone to Testimony

**Update Prisma schema** — add fields to Testimony model:

```prisma
model Testimony {
  // ... existing fields ...
  phone       String?
  location    String?
}
```

Run: `npx prisma db push`

**Update testimony POST API** (`src/app/api/testimony/route.ts`):

```typescript
const TestimonySchema = z.object({
  // ... existing fields ...
  phone: z.string().min(7).max(20).optional(),
  location: z.string().max(200).optional(),
})

// In db.testimony.create:
data: {
  // ... existing fields ...
  phone: parsed.data.phone || null,
  location: parsed.data.location || null,
}
```

**Update TestimonySubmitModal** — add phone and location fields after the name field:

```typescript
{/* Phone */}
<div>
  <label style={labelStyle}>Phone Number *</label>
  <input
    type="tel"
    value={form.phone}
    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
    placeholder="+234..."
    required
    style={inputStyle}
    onFocus={e => (e.target.style.borderColor = '#C9A84C')}
    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
  />
</div>

{/* Location */}
<div>
  <label style={labelStyle}>Location (City, Country) *</label>
  <input
    value={form.location}
    onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
    placeholder="e.g. Abuja, Nigeria"
    required
    style={inputStyle}
    onFocus={e => (e.target.style.borderColor = '#C9A84C')}
    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
  />
</div>
```

Update form state to include new fields:
```typescript
const [form, setForm] = useState({
  email: '', name: '', isAnonymous: false,
  title: '', body: '', videoUrl: '',
  phone: '', location: '',  // ADD THESE
})
```

---

## TASK 3 — Hide Anonymous Email from Admin

Open `src/components/admin/prayer/PrayerManager.tsx`.

When a prayer request is anonymous, the email should NOT be shown to the admin. Only the subject and body should be visible.

```typescript
{/* Email display — hide if anonymous */}
{!request.isAnonymous ? (
  <p className="font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
    {request.email} · {formatDate(request.createdAt)}
  </p>
) : (
  <p className="font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
    Anonymous · {formatDate(request.createdAt)}
  </p>
)}

{/* Name display */}
<p className="font-body text-sm font-medium" style={{ color: 'var(--a-text-secondary)' }}>
  {request.isAnonymous ? 'Anonymous' : (request.name ?? 'Community Member')}
</p>
```

Also — when admin clicks "Reply by Email" on an anonymous request, they should still be able to send the reply (the system knows the email internally), but the UI should show "This person submitted anonymously — your reply will be sent without revealing their identity to you":

```typescript
{/* Reply panel — anonymous note */}
{selectedRequest?.isAnonymous && (
  <div className="flex items-start gap-2 p-3 mb-4 border"
    style={{ borderColor: 'rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.05)' }}>
    <span className="text-gold text-sm shrink-0">🔒</span>
    <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--a-text-muted)' }}>
      This request was submitted anonymously. Your reply will be sent to their email,
      but their address is kept private from the admin view.
    </p>
  </div>
)}
```

The reply API already sends to `request.email` — no API changes needed. Only the admin UI hides the email display.

---

## TASK 4 — Premium Toggle Redesign

Replace all toggles across the entire codebase with a new premium design.

**Create a reusable Toggle component:**

Create `src/components/shared/Toggle.tsx`:

```typescript
'use client'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  size?: 'sm' | 'md'
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, size = 'md', disabled = false }: ToggleProps) {
  const width = size === 'sm' ? 36 : 44
  const height = size === 'sm' ? 20 : 24
  const thumbSize = size === 'sm' ? 14 : 18
  const thumbOffset = size === 'sm' ? 3 : 3
  const translateX = size === 'sm' ? 16 : 20

  return (
    <label
      className="flex items-center gap-3 cursor-pointer select-none"
      style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative shrink-0 transition-all duration-300 focus:outline-none"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: `${height / 2}px`,
          background: checked
            ? 'linear-gradient(135deg, #C9A84C, #E8C96A)'
            : 'rgba(255,255,255,0.1)',
          border: checked
            ? '1px solid rgba(201,168,76,0.5)'
            : '1px solid rgba(255,255,255,0.15)',
          boxShadow: checked
            ? '0 0 12px rgba(201,168,76,0.25)'
            : 'inset 0 1px 3px rgba(0,0,0,0.3)',
        }}
      >
        {/* Thumb */}
        <span
          className="absolute top-0 transition-transform duration-300"
          style={{
            width: `${thumbSize}px`,
            height: `${thumbSize}px`,
            borderRadius: '50%',
            background: checked ? '#0F0F0F' : 'rgba(255,255,255,0.6)',
            top: `${thumbOffset}px`,
            left: `${thumbOffset}px`,
            transform: checked ? `translateX(${translateX}px)` : 'translateX(0)',
            boxShadow: checked
              ? '0 1px 3px rgba(0,0,0,0.4)'
              : '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      </button>

      {label && (
        <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {label}
        </span>
      )}
    </label>
  )
}
```

**Admin version of Toggle** (for light admin background):

```typescript
// In the same file, export an AdminToggle variant:
export function AdminToggle({ checked, onChange, label, size = 'md', disabled = false }: ToggleProps) {
  const width = size === 'sm' ? 36 : 44
  const height = size === 'sm' ? 20 : 24
  const thumbSize = size === 'sm' ? 14 : 18
  const thumbOffset = 3
  const translateX = size === 'sm' ? 16 : 20

  return (
    <label
      className="flex items-center gap-3 cursor-pointer select-none"
      style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative shrink-0 transition-all duration-300 focus:outline-none"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: `${height / 2}px`,
          background: checked
            ? 'linear-gradient(135deg, var(--a-gold), #E8C96A)'
            : 'var(--a-border)',
          border: `1px solid ${checked ? 'var(--a-gold-border)' : 'var(--a-border-strong)'}`,
          boxShadow: checked ? '0 0 8px var(--a-gold-light)' : 'none',
        }}
      >
        <span
          className="absolute transition-transform duration-300"
          style={{
            width: `${thumbSize}px`,
            height: `${thumbSize}px`,
            borderRadius: '50%',
            background: '#FFFFFF',
            top: `${thumbOffset}px`,
            left: `${thumbOffset}px`,
            transform: checked ? `translateX(${translateX}px)` : 'translateX(0)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          }}
        />
      </button>

      {label && (
        <span className="font-body text-sm" style={{ color: 'var(--a-text-secondary)' }}>
          {label}
        </span>
      )}
    </label>
  )
}
```

**Replace all existing toggle implementations across the codebase:**

Search for these patterns and replace with the new `Toggle` or `AdminToggle` component:

```typescript
// OLD pattern (public forms — dark background):
<button
  type="button"
  onClick={() => setForm(p => ({ ...p, isAnonymous: !p.isAnonymous }))}
  className="relative w-10 h-5 rounded-full transition-colors"
  style={{ background: form.isAnonymous ? '#C9A84C' : 'rgba(255,255,255,0.15)' }}
>
  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.isAnonymous ? 'translate-x-5' : 'translate-x-0.5'}`} />
</button>

// REPLACE WITH:
<Toggle
  checked={form.isAnonymous}
  onChange={(val) => setForm(p => ({ ...p, isAnonymous: val }))}
  label="Submit anonymously"
/>
```

```typescript
// OLD pattern (admin — light background):
<button
  onClick={() => setNewField(p => ({ ...p, required: !p.required }))}
  className="relative w-9 h-5 rounded-full transition-colors"
  style={{ background: newField.required ? 'var(--a-gold)' : 'var(--a-border)' }}
>
  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ...`} />
</button>

// REPLACE WITH:
<AdminToggle
  checked={newField.required}
  onChange={(val) => setNewField(p => ({ ...p, required: val }))}
  label="Required"
/>
```

**Files to update with new Toggle:**

Public forms (use `Toggle`):
- `src/components/join/JoinPageClient.tsx` — anonymous toggle
- `src/components/prayer/PrayerWallClient.tsx` — anonymous toggle
- `src/components/testimony/TestimonySubmitModal.tsx` — anonymous toggle
- `src/components/events/EventRegistrationModal.tsx` — if any toggles exist

Admin forms (use `AdminToggle`):
- `src/components/admin/members/MembersManager.tsx` — add field required toggle
- `src/components/admin/events/EventsManager.tsx` — form field required toggle
- `src/components/admin/forms/FormBuilderEditor.tsx` — any required/active toggles
- `src/components/admin/forms/SortableFieldCard.tsx` — active toggle
- `src/components/admin/scripture/ScriptureManager.tsx` — active toggle
- `src/components/admin/automation/AutomationManager.tsx` — devotional/event reminder toggles
- All other admin toggle instances

---

## COMPLETION CHECKLIST

**Testimony Member Gate**
- [ ] Testimony submit modal checks email against community members
- [ ] Non-member sees red error with "join community" link
- [ ] Submit button disabled when not a member
- [ ] Error clears when email is changed

**Testimony New Fields**
- [ ] Phone number field added (required)
- [ ] Location field added (required)
- [ ] Schema updated with `npx prisma db push`
- [ ] API accepts and saves phone + location
- [ ] Admin testimony view shows phone + location

**Anonymous Email Privacy**
- [ ] Admin prayer list shows "Anonymous" not the email when request is anonymous
- [ ] Reply panel shows privacy note for anonymous requests
- [ ] Reply still sends to the correct email (API unchanged)

**Toggle Redesign**
- [ ] New `Toggle` component created with gold gradient + glow
- [ ] New `AdminToggle` component created with admin vars
- [ ] All public form toggles replaced with `Toggle`
- [ ] All admin toggles replaced with `AdminToggle`
- [ ] Toggles animate smoothly on click
- [ ] Dark thumb on gold background (checked state)
- [ ] Translucent thumb on dark background (unchecked state)

**General**
- [ ] `npx prisma db push` for phone/location fields
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The `Toggle` component uses a `<button>` with `role="switch"` for accessibility — this is correct semantic HTML for toggles.
- The gold gradient on the active state (`linear-gradient(135deg, #C9A84C, #E8C96A)`) gives depth and makes it feel premium rather than a flat colored pill.
- The dark thumb (`#0F0F0F`) on gold background creates strong contrast — always readable.
- `AdminToggle` uses CSS variables so it works correctly in both admin light and dark modes.
- When replacing old toggles, make sure to remove the old button AND the span child — the entire inline toggle implementation gets replaced with a single `<Toggle>` or `<AdminToggle>` component.
- The testimony form now requires phone AND location in addition to the existing fields. Update the Zod schema in the API to make them required (not optional).
