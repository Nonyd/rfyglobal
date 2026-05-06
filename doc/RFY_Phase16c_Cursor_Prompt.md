# ROOM FOR YOU — Phase 16c Cursor Prompt
## Fully Editable Event Registration Form Fields

---

## CONTEXT

The event registration form fields panel currently shows core fields (Name, Email, Phone, Location, Expectations) as read-only greyed-out items. All fields need to be fully editable — admin can change labels, placeholders, required status, and delete any field except Email (which must stay for duplicate registration checking).

**Architecture change:** Move all registration form fields — including the previously "core" ones — into the `EventFormField` model in the DB. Each event gets its fields seeded with the defaults on first open. Admin can then edit, reorder, or remove any field.

---

## TASK 1 — Seed Default Fields on First Open

Update `src/app/api/events/[id]/fields/route.ts`.

In the GET handler, if an event has zero fields, automatically create the default core fields:

```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  const event = await db.event.findFirst({
    where: { OR: [{ slug: params.id }, { id: params.id }] },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let fields = await db.eventFormField.findMany({
    where: { eventId: event.id },
    orderBy: { order: 'asc' },
  })

  // Auto-seed default fields if event has none yet
  if (fields.length === 0) {
    const defaults = [
      { label: 'Full Name', type: 'SHORT_TEXT', placeholder: 'Your full name', required: true, order: 0, isCore: true },
      { label: 'Email Address', type: 'EMAIL', placeholder: 'your@email.com', required: true, order: 1, isCore: true },
      { label: 'Phone Number', type: 'PHONE', placeholder: '+234...', required: true, order: 2, isCore: true },
      { label: 'Location', type: 'SHORT_TEXT', placeholder: 'City, Country', required: true, order: 3, isCore: true },
      { label: 'Expectations', type: 'LONG_TEXT', placeholder: 'What are you expecting from this gathering?', required: false, order: 4, isCore: false },
    ]

    await db.eventFormField.createMany({
      data: defaults.map(f => ({
        eventId: event.id,
        label: f.label,
        type: f.type as FieldType,
        placeholder: f.placeholder,
        required: f.required,
        order: f.order,
        isActive: true,
      })),
    })

    fields = await db.eventFormField.findMany({
      where: { eventId: event.id },
      orderBy: { order: 'asc' },
    })
  }

  // Public requests get only active fields
  // Authenticated admin requests get all fields
  if (!session) {
    return NextResponse.json(fields.filter(f => f.isActive))
  }

  return NextResponse.json(fields)
}
```

---

## TASK 2 — Add PATCH to Field Route

Update `src/app/api/events/[id]/fields/[fieldId]/route.ts`.

The PATCH handler already exists. Ensure it handles all editable properties:

```typescript
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; fieldId: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Prevent disabling the email field (needed for duplicate checking)
  const field = await db.eventFormField.findUnique({ where: { id: params.fieldId } })
  if (field?.type === 'EMAIL' && body.isActive === false) {
    return NextResponse.json({
      error: 'The email field cannot be disabled — it is required for duplicate registration checking.',
    }, { status: 400 })
  }

  const updated = await db.eventFormField.update({
    where: { id: params.fieldId },
    data: {
      ...(body.label !== undefined && { label: body.label }),
      ...(body.placeholder !== undefined && { placeholder: body.placeholder }),
      ...(body.required !== undefined && { required: body.required }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.order !== undefined && { order: body.order }),
      ...(body.type !== undefined && { type: body.type }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; fieldId: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Prevent deleting the email field
  const field = await db.eventFormField.findUnique({ where: { id: params.fieldId } })
  if (field?.type === 'EMAIL') {
    return NextResponse.json({
      error: 'The email field cannot be deleted — it is required for duplicate registration checking.',
    }, { status: 400 })
  }

  await db.eventFormField.delete({ where: { id: params.fieldId } })
  return NextResponse.json({ success: true })
}
```

---

## TASK 3 — Update EventsManager Fields Panel

Open `src/components/admin/events/EventsManager.tsx`.

Replace the static core fields preview and the separate custom fields list with a **single unified editable list** of all fields.

**New fields panel behavior:**
- All fields are shown in order (seeded defaults first)
- Each field row has: drag handle (or up/down arrows), label input, placeholder input, required toggle, delete button
- Email field row has a lock icon instead of delete, with tooltip "Required for registration"
- "Add Field" section stays at the bottom
- Changes save on blur (auto-save) or via an explicit Save button per row

```typescript
// Replace the entire fields panel content with this pattern:

// State
const [editingField, setEditingField] = useState<string | null>(null)
const [fieldEdits, setFieldEdits] = useState<Record<string, Partial<EventFormField>>>({})

const updateFieldLocally = (fieldId: string, updates: Partial<EventFormField>) => {
  setFieldEdits(prev => ({ ...prev, [fieldId]: { ...prev[fieldId], ...updates } }))
}

const saveFieldEdit = async (fieldId: string) => {
  const edits = fieldEdits[fieldId]
  if (!edits || !fieldsEvent) return

  try {
    const res = await fetch(`/api/events/${fieldsEvent.id}/fields/${fieldId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(edits),
    })
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error ?? 'Failed to save')
      return
    }
    const updated = await res.json()
    setEventFields(prev => prev.map(f => f.id === fieldId ? updated : f))
    setFieldEdits(prev => { const next = { ...prev }; delete next[fieldId]; return next })
    toast.success('Field updated')
  } catch {
    toast.error('Failed to save field')
  }
}

// Render unified field list:
{eventFields.map((field, index) => {
  const isEmail = field.type === 'EMAIL'
  const edits = fieldEdits[field.id] ?? {}
  const currentLabel = edits.label ?? field.label
  const currentPlaceholder = edits.placeholder ?? field.placeholder ?? ''
  const currentRequired = edits.required ?? field.required
  const hasEdits = Object.keys(fieldEdits[field.id] ?? {}).length > 0

  return (
    <div key={field.id}
      className="border p-4 space-y-3"
      style={{
        borderColor: hasEdits ? 'var(--a-gold-border)' : 'var(--a-border)',
        background: hasEdits ? 'var(--a-gold-light)' : 'var(--a-surface)',
      }}>

      {/* Field header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 font-body uppercase tracking-widest"
            style={{
              background: 'var(--a-sidebar)',
              color: 'var(--a-text-muted)',
              border: '1px solid var(--a-border)',
            }}>
            {field.type.replace('_', ' ').toLowerCase()}
          </span>
          {isEmail && (
            <span className="text-[10px] font-body"
              style={{ color: 'var(--a-gold)' }}>
              🔒 required for registration
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasEdits && (
            <button
              onClick={() => saveFieldEdit(field.id)}
              className="px-3 py-1 text-xs font-body font-medium text-white transition-all"
              style={{ background: 'var(--a-gold)' }}
            >
              Save
            </button>
          )}
          {!isEmail && (
            <button
              onClick={() => deleteField(field.id)}
              className="p-1.5 transition-colors"
              style={{ color: 'var(--a-text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--a-red)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--a-text-muted)')}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Label */}
      <div>
        <label className="block text-[10px] uppercase tracking-widest mb-1 font-body"
          style={{ color: 'var(--a-text-muted)' }}>Label</label>
        <input
          value={currentLabel}
          onChange={e => updateFieldLocally(field.id, { label: e.target.value })}
          onBlur={() => hasEdits && saveFieldEdit(field.id)}
          className="w-full border px-3 py-2 font-body text-sm focus:outline-none"
          style={{
            background: 'var(--a-bg)',
            borderColor: 'var(--a-border)',
            color: 'var(--a-text)',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--a-gold)')}
        />
      </div>

      {/* Placeholder */}
      <div>
        <label className="block text-[10px] uppercase tracking-widest mb-1 font-body"
          style={{ color: 'var(--a-text-muted)' }}>Placeholder</label>
        <input
          value={currentPlaceholder}
          onChange={e => updateFieldLocally(field.id, { placeholder: e.target.value })}
          onBlur={() => hasEdits && saveFieldEdit(field.id)}
          placeholder="Optional placeholder text"
          className="w-full border px-3 py-2 font-body text-sm focus:outline-none"
          style={{
            background: 'var(--a-bg)',
            borderColor: 'var(--a-border)',
            color: 'var(--a-text)',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--a-gold)')}
        />
      </div>

      {/* Required toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            updateFieldLocally(field.id, { required: !currentRequired })
            // Auto-save required toggle immediately
            setTimeout(() => saveFieldEdit(field.id), 50)
          }}
          disabled={isEmail} // email is always required
          className="relative w-8 h-4 rounded-full transition-colors disabled:opacity-50"
          style={{ background: currentRequired ? 'var(--a-gold)' : 'var(--a-border)' }}
        >
          <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${currentRequired ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
        <span className="font-body text-xs" style={{ color: 'var(--a-text-secondary)' }}>
          Required
        </span>
      </div>
    </div>
  )
})}
```

---

## TASK 4 — Update EventRegistrationModal to Use DB Fields

Open `src/components/events/EventRegistrationModal.tsx`.

Since all fields now come from the DB (including the previously hardcoded Name, Email, Phone, Location, Expectations), remove the hardcoded core fields and render everything from `customFields`:

```typescript
// BEFORE — hardcoded fields + customFields rendered separately
// AFTER — render ALL fields from props (now called `fields` not `customFields`)

interface EventRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  eventSlug: string
  eventTitle: string
  eventDate: string
  eventCity: string
  fields: EventFormField[]  // renamed from customFields, now includes ALL fields
}

// The form state is now fully dynamic:
const [fieldValues, setFieldValues] = useState<Record<string, string>>({})

// Submit sends all field values:
body: JSON.stringify({
  fields: fieldValues,  // { fieldId: value, fieldId: value, ... }
})

// Render ALL fields from props:
{fields.map(field => {
  const value = fieldValues[field.id] ?? ''
  const onChange = (val: string) => setFieldValues(p => ({ ...p, [field.id]: val }))

  return (
    <div key={field.id}>
      <label style={labelStyle}>
        {field.label}{field.required ? ' *' : ''}
      </label>
      {/* render input based on field.type */}
      {field.type === 'LONG_TEXT' ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
          required={field.required}
          rows={3}
          style={{ ...inputStyle, resize: 'none' }}
          onFocus={e => (e.target.style.borderColor = '#C9A84C')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
        />
      ) : field.type === 'DROPDOWN' ? (
        <select value={value} onChange={e => onChange(e.target.value)}
          required={field.required}
          style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select an option</option>
          {(field.options as string[] ?? []).map(opt => (
            <option key={opt} value={opt}
              style={{ background: '#1A1A1A', color: '#F8F8F8' }}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          type={field.type === 'EMAIL' ? 'email' : field.type === 'PHONE' ? 'tel' : field.type === 'NUMBER' ? 'number' : field.type === 'DATE' ? 'date' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
          required={field.required}
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = '#C9A84C')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
        />
      )}
    </div>
  )
})}
```

---

## TASK 5 — Update Registration API to Use Dynamic Fields

Update `src/app/api/events/[id]/register/route.ts`.

Since fields are now fully dynamic, the registration API should validate and store all field values generically:

```typescript
const RegisterSchema = z.object({
  fields: z.record(z.string(), z.string()), // { fieldId: value }
})

export async function POST(req, { params }) {
  // ... rate limit + event lookup ...

  const body = await req.json()
  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid submission' }, { status: 400 })
  }

  const { fields: fieldValues } = parsed.data

  // Load the event's fields to validate
  const formFields = await db.eventFormField.findMany({
    where: { eventId: event.id, isActive: true },
    orderBy: { order: 'asc' },
  })

  // Extract key fields for the registration record
  const emailField = formFields.find(f => f.type === 'EMAIL')
  const nameField = formFields.find(f => f.label.toLowerCase().includes('name'))
  const phoneField = formFields.find(f => f.type === 'PHONE')
  const locationField = formFields.find(f => f.label.toLowerCase().includes('location'))
  const expectationsField = formFields.find(f => f.type === 'LONG_TEXT')

  const email = emailField ? fieldValues[emailField.id] : ''
  const name = nameField ? fieldValues[nameField.id] : ''
  const phone = phoneField ? fieldValues[phoneField.id] : ''
  const location = locationField ? fieldValues[locationField.id] : ''
  const expectations = expectationsField ? fieldValues[expectationsField.id] : ''

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  // Validate all required fields
  for (const field of formFields) {
    if (field.required) {
      const value = fieldValues[field.id]
      if (!value || value.trim() === '') {
        return NextResponse.json(
          { error: `"${field.label}" is required.` },
          { status: 400 }
        )
      }
    }
  }

  // Check duplicate
  const existing = await db.eventRegistration.findUnique({
    where: { eventId_email: { eventId: event.id, email } },
  })
  if (existing) {
    return NextResponse.json({
      error: 'You are already registered for this event.',
      alreadyRegistered: true,
    }, { status: 409 })
  }

  // Create registration — store all field values in extraFields
  const registration = await db.eventRegistration.create({
    data: {
      eventId: event.id,
      name: name || email, // fallback to email if name field was renamed
      email,
      phone: phone || 'N/A',
      location: location || 'N/A',
      expectations: expectations || null,
      extraFields: fieldValues, // store ALL values including core ones
    },
  })

  // Send confirmation email
  try {
    await sendEventRegistrationEmail({ name: name || email, email, event })
  } catch (err) {
    console.error('[EventReg] Failed to send confirmation email:', err)
  }

  return NextResponse.json({ success: true, registrationId: registration.id }, { status: 201 })
}
```

---

## TASK 6 — Update SingleEventClient to Pass All Fields

Open `src/components/events/SingleEventClient.tsx`.

Rename `customFields` prop to `fields` and pass it through:

```typescript
// Props interface:
interface SingleEventClientProps {
  event: Event
  otherEvents: Event[]
  fields: EventFormField[]  // was customFields
}

// Modal:
<EventRegistrationModal
  ...
  fields={fields}  // was customFields={formFields}
/>
```

---

## COMPLETION CHECKLIST

- [ ] Opening "Form Fields" panel auto-seeds default fields for events that have none
- [ ] All fields (Name, Email, Phone, Location, Expectations + any custom) shown in unified editable list
- [ ] Admin can edit any field's label
- [ ] Admin can edit any field's placeholder
- [ ] Admin can toggle required on/off for any field (except Email — always required)
- [ ] Email field shows lock icon and cannot be deleted
- [ ] All other fields can be deleted
- [ ] Changes auto-save on blur or via Save button
- [ ] Registration modal renders all fields from DB (no hardcoded fields)
- [ ] Registration API validates all required fields dynamically
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The auto-seed in the GET handler only fires when `fields.length === 0` for an event. It runs once per event on first panel open. After that, the admin has full control.
- The Email field protection is enforced at both the API level (PATCH and DELETE refuse changes to EMAIL type) and the UI level (lock icon, disabled delete/required toggle).
- The `extraFields` JSON on `EventRegistration` now stores ALL field values keyed by field ID — both core and custom. The explicit columns (`name`, `email`, `phone`, `location`, `expectations`) are still populated for backward compatibility with the registrations table display and CSV export.
- When renaming `customFields` to `fields` in props, update all call sites: `SingleEventClient`, `events/[slug]/page.tsx`.
