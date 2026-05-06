# ROOM FOR YOU — Phase 15b Cursor Prompt
## Event Page Navbar Fix · Per-Event Custom Registration Fields

---

## CONTEXT

Two fixes in this phase:

1. **Event page layout** — The right side content (title, details, CTAs) starts too high and sits partially behind the fixed navbar. The content needs to be pushed down so the navbar clears it properly on all screen sizes.

2. **Per-event custom registration fields** — Admin can add, edit, and remove custom fields on the registration popup form for each individual event. Each event has its own field configuration stored in the DB.

---

## TASK 1 — Fix Event Page Navbar Overlap

Open `src/components/events/SingleEventClient.tsx`.

The issue: the right-side content panel starts at the top of the viewport, partially hidden behind the fixed navbar (~72px tall).

**Fix the main section and content panel:**

```typescript
// The outer section — no changes needed here
<section className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

// LEFT panel (image) — add top padding on mobile, sticky on desktop
<motion.div
  className="relative min-h-[60vh] lg:min-h-screen lg:sticky lg:top-0"
>
  {/* image content unchanged */}
  
  {/* Move the date badge DOWN so it clears the navbar */}
  {/* BEFORE: top-8 left-8 */}
  {/* AFTER: top-24 left-8 (on mobile) / top-24 left-12 (desktop) */}
  <div className="absolute top-24 left-8 lg:top-24 lg:left-12 z-10">
    {/* date badge content unchanged */}
  </div>

  {/* Back link stays at bottom */}
  <Link href="/events"
    className="absolute bottom-8 left-8 lg:bottom-12 lg:left-12 z-10 ...">
    ← All Events
  </Link>
</motion.div>

// RIGHT panel — add significant top padding to clear the fixed navbar
<motion.div
  className="flex flex-col justify-center px-8 lg:px-16 xl:px-20 pt-28 pb-16 lg:pt-32 lg:pb-32"
  style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}
>
  {/* all content unchanged */}
</motion.div>
```

The key change: `pt-28` on mobile (112px) and `lg:pt-32` on desktop (128px) on the right panel. This ensures the city tag and title are always clearly below the 72px fixed navbar with comfortable breathing room.

Also wrap the entire component in a `<main>` tag with `pt-20` for the mobile stacked view:

```typescript
return (
  <main className="min-h-screen bg-void">
    {/* navbar clearance for mobile stacked layout */}
    <div className="h-20 lg:hidden" /> {/* spacer for mobile only */}
    
    <section className="grid grid-cols-1 lg:grid-cols-2 lg:min-h-screen">
      {/* LEFT image panel */}
      {/* RIGHT details panel */}
    </section>

    {/* Other events section */}
  </main>
)
```

---

## TASK 2 — Prisma Schema: Per-Event Registration Fields

Add to `prisma/schema.prisma`:

```prisma
model EventFormField {
  id          String    @id @default(cuid())
  eventId     String
  event       Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  label       String
  type        FieldType // reuse existing enum
  placeholder String?
  required    Boolean   @default(false)
  options     Json?
  order       Int       @default(0)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
}
```

Update the `Event` model to include the relation:

```prisma
model Event {
  // ... existing fields ...
  registrations   EventRegistration[]
  formFields      EventFormField[]      // ADD THIS
}
```

Also update `EventRegistration` to store extra field values:

```prisma
model EventRegistration {
  // ... existing fields ...
  extraFields  Json?   // stores values for custom fields as {fieldId: value}
}
```

Run: `npx prisma db push`

---

## TASK 3 — Event Form Fields API

Create `src/app/api/events/[id]/fields/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// GET — public: fetch active fields for an event
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const event = await db.event.findFirst({
    where: { OR: [{ slug: params.id }, { id: params.id }] },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const fields = await db.eventFormField.findMany({
    where: { eventId: event.id, isActive: true },
    orderBy: { order: 'asc' },
  })

  return NextResponse.json(fields)
}

// POST — admin: add a field to an event's registration form
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const event = await db.event.findFirst({
    where: { OR: [{ slug: params.id }, { id: params.id }] },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()

  // Get current max order
  const maxOrder = await db.eventFormField.count({ where: { eventId: event.id } })

  const field = await db.eventFormField.create({
    data: {
      eventId: event.id,
      label: body.label,
      type: body.type ?? 'SHORT_TEXT',
      placeholder: body.placeholder ?? null,
      required: body.required ?? false,
      options: body.options ?? null,
      order: maxOrder,
    },
  })

  return NextResponse.json(field, { status: 201 })
}
```

Create `src/app/api/events/[id]/fields/[fieldId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// PATCH — update a field
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; fieldId: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const field = await db.eventFormField.update({
    where: { id: params.fieldId },
    data: body,
  })

  return NextResponse.json(field)
}

// DELETE — remove a field
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; fieldId: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.eventFormField.delete({ where: { id: params.fieldId } })
  return NextResponse.json({ success: true })
}
```

---

## TASK 4 — Update Registration API to Accept Extra Fields

Open `src/app/api/events/[id]/register/route.ts`.

Update the Zod schema to accept extra fields:

```typescript
const RegisterSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  location: z.string().min(1).max(200),
  expectations: z.string().max(1000).optional(),
  extraFields: z.record(z.string(), z.string()).optional(),
})
```

Update the `db.eventRegistration.create` call:

```typescript
const registration = await db.eventRegistration.create({
  data: {
    eventId: event.id,
    name,
    email,
    phone,
    location,
    expectations,
    extraFields: parsed.data.extraFields ?? null,
  },
})
```

Also validate required custom fields:

```typescript
// After parsing, before creating:
const customFields = await db.eventFormField.findMany({
  where: { eventId: event.id, isActive: true, required: true },
})

for (const field of customFields) {
  const value = parsed.data.extraFields?.[field.id]
  if (!value || value.trim() === '') {
    return NextResponse.json(
      { error: `"${field.label}" is required.` },
      { status: 400 }
    )
  }
}
```

---

## TASK 5 — Update SingleEventClient to Load Custom Fields

Open `src/components/events/SingleEventClient.tsx`.

Add `formFields` to the props and fetch them from the API when the modal opens:

```typescript
interface SingleEventClientProps {
  event: Event
  otherEvents: Event[]
  formFields: EventFormField[]  // ADD THIS — passed from server
}

export function SingleEventClient({ event, otherEvents, formFields }: SingleEventClientProps) {
  // ... existing state ...
}
```

Pass `formFields` to the modal:

```typescript
<EventRegistrationModal
  isOpen={registrationOpen}
  onClose={() => setRegistrationOpen(false)}
  eventSlug={event.slug ?? event.id}
  eventTitle={event.title}
  eventDate={dateFormatted}
  eventCity={event.city}
  customFields={formFields}  // ADD THIS
/>
```

---

## TASK 6 — Update Single Event Page to Fetch Form Fields

Open `src/app/(public)/events/[slug]/page.tsx`.

Fetch the event's custom form fields server-side:

```typescript
export default async function SingleEventPage({ params }: { params: { slug: string } }) {
  const event = await db.event.findFirst({
    where: { OR: [{ slug: params.slug }, { id: params.slug }], isActive: true },
  })

  if (!event) notFound()

  const [otherEvents, formFields] = await Promise.all([
    db.event.findMany({
      where: {
        isActive: true,
        date: { gte: new Date() },
        id: { not: event.id },
      },
      orderBy: { date: 'asc' },
      take: 3,
    }),
    db.eventFormField.findMany({
      where: { eventId: event.id, isActive: true },
      orderBy: { order: 'asc' },
    }),
  ])

  return (
    <>
      <Navbar />
      <SingleEventClient
        event={event}
        otherEvents={otherEvents}
        formFields={formFields}
      />
      <Footer />
    </>
  )
}
```

---

## TASK 7 — Update EventRegistrationModal to Render Custom Fields

Open `src/components/events/EventRegistrationModal.tsx`.

Add `customFields` prop and render them after the core fields:

```typescript
import type { EventFormField } from '@prisma/client'

interface EventRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  eventSlug: string
  eventTitle: string
  eventDate: string
  eventCity: string
  customFields?: EventFormField[]  // ADD THIS
}

export function EventRegistrationModal({
  // ... existing props ...
  customFields = [],
}: EventRegistrationModalProps) {
  const [extraValues, setExtraValues] = useState<Record<string, string>>({})

  // In handleSubmit, include extraFields:
  const res = await fetch(`/api/events/${eventSlug}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...form, extraFields: extraValues }),
  })

  // After the Expectations textarea, render custom fields:
  {customFields.map(field => (
    <div key={field.id}>
      <label style={labelStyle}>
        {field.label}{field.required ? ' *' : ''}
      </label>
      {field.type === 'LONG_TEXT' ? (
        <textarea
          value={extraValues[field.id] ?? ''}
          onChange={e => setExtraValues(p => ({ ...p, [field.id]: e.target.value }))}
          placeholder={field.placeholder ?? ''}
          required={field.required}
          rows={3}
          style={{ ...inputStyle, resize: 'none' }}
          onFocus={e => (e.target.style.borderColor = '#C9A84C')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
        />
      ) : field.type === 'DROPDOWN' ? (
        <select
          value={extraValues[field.id] ?? ''}
          onChange={e => setExtraValues(p => ({ ...p, [field.id]: e.target.value }))}
          required={field.required}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="">Select an option</option>
          {(field.options as string[] ?? []).map(opt => (
            <option key={opt} value={opt}
              style={{ background: '#1A1A1A', color: '#F8F8F8' }}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          value={extraValues[field.id] ?? ''}
          onChange={e => setExtraValues(p => ({ ...p, [field.id]: e.target.value }))}
          placeholder={field.placeholder ?? ''}
          required={field.required}
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = '#C9A84C')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
        />
      )}
    </div>
  ))}
}
```

---

## TASK 8 — Admin: Add Form Fields Management to EventsManager

Open `src/components/admin/events/EventsManager.tsx`.

Add a "Form Fields" button to each event card that opens a slide-in panel for managing that event's registration form fields.

The panel must include:

**Header:**
- "Registration Form Fields" title
- Event name subtitle
- "+ Add Field" button

**Fields list:**
- Each field shown as a row with: label, type badge, required indicator
- Edit button → inline edit (label, placeholder, required toggle)
- Delete button with confirmation
- Drag to reorder (optional — use up/down arrows if DnD is complex)

**Add Field form (inline at bottom of list):**
- Label input
- Type selector: Short Text, Long Text, Dropdown, Phone, Number
- Placeholder input
- Required toggle
- "Add" button → POST `/api/events/[id]/fields`

```typescript
// Add state:
const [fieldsEvent, setFieldsEvent] = useState<EventType | null>(null)
const [eventFields, setEventFields] = useState<EventFormField[]>([])
const [loadingFields, setLoadingFields] = useState(false)
const [newField, setNewField] = useState({
  label: '', type: 'SHORT_TEXT', placeholder: '', required: false,
})
const [addingField, setAddingField] = useState(false)

const openFields = async (event: EventType) => {
  setFieldsEvent(event)
  setLoadingFields(true)
  try {
    const res = await fetch(`/api/events/${event.id}/fields`)
    const data = await res.json()
    setEventFields(data)
  } catch {
    toast.error('Failed to load fields')
  } finally {
    setLoadingFields(false)
  }
}

const addField = async () => {
  if (!newField.label.trim() || !fieldsEvent) return
  setAddingField(true)
  try {
    const res = await fetch(`/api/events/${fieldsEvent.id}/fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newField),
    })
    if (!res.ok) throw new Error('Failed')
    const field = await res.json()
    setEventFields(prev => [...prev, field])
    setNewField({ label: '', type: 'SHORT_TEXT', placeholder: '', required: false })
    toast.success('Field added')
  } catch {
    toast.error('Failed to add field')
  } finally {
    setAddingField(false)
  }
}

const deleteField = async (fieldId: string) => {
  if (!confirm('Remove this field?') || !fieldsEvent) return
  const res = await fetch(`/api/events/${fieldsEvent.id}/fields/${fieldId}`, {
    method: 'DELETE',
  })
  if (res.ok) {
    setEventFields(prev => prev.filter(f => f.id !== fieldId))
    toast.success('Field removed')
  } else {
    toast.error('Failed to remove field')
  }
}
```

Add "Form Fields" button to each event card:

```typescript
<button
  onClick={() => openFields(event)}
  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-body border transition-all"
  style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-secondary)' }}
  onMouseEnter={e => {
    e.currentTarget.style.borderColor = 'var(--a-gold-border)'
    e.currentTarget.style.color = 'var(--a-gold)'
  }}
  onMouseLeave={e => {
    e.currentTarget.style.borderColor = 'var(--a-border)'
    e.currentTarget.style.color = 'var(--a-text-secondary)'
  }}
>
  <Settings size={12} />
  Form Fields
</button>
```

Form Fields slide-in panel:

```typescript
<AnimatePresence>
  {fieldsEvent && (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => setFieldsEvent(null)}
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.4)' }}
      />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg overflow-y-auto"
        style={{ background: 'var(--a-surface)', borderLeft: '1px solid var(--a-border)' }}
      >
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-xs uppercase tracking-widest mb-1"
                style={{ color: 'var(--a-gold)' }}>
                Registration Form Fields
              </p>
              <h3 className="font-display text-lg font-semibold"
                style={{ color: 'var(--a-text)' }}>
                {fieldsEvent.title}
              </h3>
            </div>
            <button onClick={() => setFieldsEvent(null)}
              style={{ color: 'var(--a-text-muted)' }}>
              <X size={20} />
            </button>
          </div>

          <div className="h-px" style={{ background: 'var(--a-border)' }} />

          {/* Info */}
          <p className="font-body text-xs leading-relaxed"
            style={{ color: 'var(--a-text-muted)' }}>
            Core fields (Name, Email, Phone, Location, Expectations) are always included.
            Add extra fields below to collect additional information for this event.
          </p>

          {/* Core fields preview — read-only */}
          <div className="space-y-2">
            {['Full Name *', 'Email Address *', 'Phone Number *', 'Location *', 'Expectations'].map(f => (
              <div key={f} className="flex items-center gap-2 px-3 py-2 border"
                style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)', opacity: 0.6 }}>
                <span className="font-body text-xs" style={{ color: 'var(--a-text-secondary)' }}>{f}</span>
                <span className="ml-auto text-[10px] font-body"
                  style={{ color: 'var(--a-text-muted)' }}>core field</span>
              </div>
            ))}
          </div>

          {/* Custom fields */}
          {loadingFields ? (
            <p className="font-body text-sm text-center py-4"
              style={{ color: 'var(--a-text-muted)' }}>Loading…</p>
          ) : eventFields.length > 0 ? (
            <div className="space-y-2">
              <p className="font-body text-xs uppercase tracking-widest"
                style={{ color: 'var(--a-text-muted)' }}>Custom Fields</p>
              {eventFields.map(field => (
                <div key={field.id}
                  className="flex items-center gap-3 px-3 py-2.5 border"
                  style={{ borderColor: 'var(--a-gold-border)', background: 'var(--a-gold-light)' }}>
                  <div className="flex-1">
                    <p className="font-body text-sm font-medium"
                      style={{ color: 'var(--a-text)' }}>
                      {field.label}{field.required ? ' *' : ''}
                    </p>
                    <p className="font-body text-xs"
                      style={{ color: 'var(--a-text-muted)' }}>
                      {field.type.replace('_', ' ').toLowerCase()}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteField(field.id)}
                    className="p-1.5 transition-colors"
                    style={{ color: 'var(--a-text-muted)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--a-red)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--a-text-muted)')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {/* Add new field */}
          <div className="border p-4 space-y-3"
            style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)' }}>
            <p className="font-body text-xs uppercase tracking-widest"
              style={{ color: 'var(--a-text-muted)' }}>Add Custom Field</p>

            <input
              value={newField.label}
              onChange={e => setNewField(p => ({ ...p, label: e.target.value }))}
              placeholder="Field label"
              className="w-full border px-3 py-2.5 font-body text-sm focus:outline-none"
              style={{ background: 'var(--a-surface)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
              onFocus={e => (e.target.style.borderColor = 'var(--a-gold)')}
              onBlur={e => (e.target.style.borderColor = 'var(--a-border)')}
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                value={newField.type}
                onChange={e => setNewField(p => ({ ...p, type: e.target.value }))}
                className="border px-3 py-2.5 font-body text-sm focus:outline-none"
                style={{ background: 'var(--a-surface)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
              >
                <option value="SHORT_TEXT">Short Text</option>
                <option value="LONG_TEXT">Long Text</option>
                <option value="PHONE">Phone</option>
                <option value="NUMBER">Number</option>
                <option value="DROPDOWN">Dropdown</option>
              </select>

              <input
                value={newField.placeholder}
                onChange={e => setNewField(p => ({ ...p, placeholder: e.target.value }))}
                placeholder="Placeholder (optional)"
                className="border px-3 py-2.5 font-body text-sm focus:outline-none"
                style={{ background: 'var(--a-surface)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNewField(p => ({ ...p, required: !p.required }))}
                  className="relative w-9 h-5 rounded-full transition-colors"
                  style={{ background: newField.required ? 'var(--a-gold)' : 'var(--a-border)' }}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${newField.required ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
                <span className="font-body text-xs" style={{ color: 'var(--a-text-secondary)' }}>Required</span>
              </div>

              <button
                onClick={addField}
                disabled={addingField || !newField.label.trim()}
                className="flex items-center gap-1.5 px-4 py-2 font-body text-xs font-medium text-white transition-all disabled:opacity-40"
                style={{ background: 'var(--a-gold)' }}
              >
                <Plus size={12} />
                {addingField ? 'Adding…' : 'Add Field'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>
```

Import `Settings`, `Trash2`, `Plus` from `lucide-react` and `EventFormField` from `@prisma/client`.

---

## PHASE 15b COMPLETION CHECKLIST

**Navbar Fix**
- [ ] Event page right side content is fully below the navbar on all screen sizes
- [ ] Date badge on image is below the navbar (not overlapping it)
- [ ] No content hidden behind the fixed navbar on desktop or mobile

**Custom Fields**
- [ ] `EventFormField` model added to Prisma and pushed to DB
- [ ] `GET /api/events/[id]/fields` returns active fields for an event
- [ ] `POST /api/events/[id]/fields` adds a field
- [ ] `DELETE /api/events/[id]/fields/[fieldId]` removes a field
- [ ] Registration API validates required custom fields
- [ ] Registration API stores extra field values
- [ ] "Form Fields" button on each event card in admin
- [ ] Slide-in panel shows core fields (greyed out) + custom fields
- [ ] Admin can add new custom fields with type and required toggle
- [ ] Admin can delete custom fields
- [ ] Custom fields render in the public registration modal
- [ ] Custom field values submitted correctly with registration

**General**
- [ ] `npx prisma db push` applies `EventFormField` model
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The navbar fix on the event page is purely CSS spacing — `pt-28` on the right panel content. No JS changes needed. Test on both mobile (stacked) and desktop (split) views.
- The `EventFormField` model uses the existing `FieldType` enum — no new enum needed.
- Core fields (Name, Email, Phone, Location, Expectations) are hardcoded in the modal and always present. Custom fields are rendered AFTER them. The admin panel shows core fields as greyed-out read-only items to make this clear.
- `extraFields` on `EventRegistration` is stored as a JSON object: `{ "fieldId": "value", "fieldId2": "value2" }`. This is flexible and doesn't require schema changes when fields are added.
- The registrations CSV export should also include custom field values. Update the CSV export in `GET /api/events/[id]/registrations?format=csv` to include extra field columns based on the event's current fields.
