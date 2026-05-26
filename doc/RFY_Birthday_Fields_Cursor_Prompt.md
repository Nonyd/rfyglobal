# ROOM FOR YOU — Birthday Month & Day Form Fields Cursor Prompt
## New Form Field Types · Privacy-Friendly Birthday Collection · Automation Update

---

## CONTEXT

Replace the existing DATE field birthday detection with two new dedicated optional fields:
- **BIRTHDAY_MONTH** — dropdown (January–December)
- **BIRTHDAY_DAY** — number input (1–31)

This is more privacy-friendly since no birth year is collected. The birthday automation already runs daily — it just needs to check these new field types instead of (or in addition to) DATE fields with "birth" in the label.

---

## TASK 1 — Add New Field Types to Schema

Open `prisma/schema.prisma`.

Find the `FormFieldType` enum and add the two new types:

```prisma
enum FormFieldType {
  SHORT_TEXT
  LONG_TEXT
  EMAIL
  PHONE
  NUMBER
  DATE
  LOCATION
  DROPDOWN
  CHECKBOX
  RADIO
  FILE
  BIRTHDAY_MONTH   // ← add
  BIRTHDAY_DAY     // ← add
}
```

Run: `npx prisma db push`

---

## TASK 2 — Update Form Builder UI

Open the form builder field type picker — `src/components/admin/forms/FieldTypePicker.tsx` or wherever field types are listed.

Add the two new field types in a **"Personal"** or **"Birthday"** category:

```typescript
// Add to field type options:
{
  type: 'BIRTHDAY_MONTH',
  label: 'Birthday Month',
  description: 'Optional month dropdown for birthday wishes',
  icon: '🎂',
  category: 'Personal',
},
{
  type: 'BIRTHDAY_DAY',
  label: 'Birthday Day',
  description: 'Optional day number for birthday wishes',
  icon: '📅',
  category: 'Personal',
},
```

---

## TASK 3 — Update Public Form Renderer

Open `src/components/forms/PublicFormRenderer.tsx`.

Add rendering for the two new field types:

### BIRTHDAY_MONTH — dropdown
```typescript
case 'BIRTHDAY_MONTH':
  return (
    <div key={field.id}>
      <label className="font-body text-sm font-medium block mb-1.5"
        style={{ color: 'var(--color-text-primary)' }}>
        {field.label}
        {!field.required && (
          <span className="ml-2 text-xs font-normal"
            style={{ color: 'var(--color-text-muted)' }}>
            (optional)
          </span>
        )}
      </label>
      <select
        value={formValues[field.id] ?? ''}
        onChange={e => setFormValues(prev => ({ ...prev, [field.id]: e.target.value }))}
        className="w-full px-3 py-2.5 font-body text-sm border outline-none"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          color: formValues[field.id] ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
        }}
      >
        <option value="">Select month...</option>
        {[
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ].map((month, i) => (
          <option key={i + 1} value={String(i + 1)}>{month}</option>
        ))}
      </select>
      <p className="font-body text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
        Share your birthday month so we can celebrate you! 🎂
      </p>
    </div>
  )
```

### BIRTHDAY_DAY — number input
```typescript
case 'BIRTHDAY_DAY':
  return (
    <div key={field.id}>
      <label className="font-body text-sm font-medium block mb-1.5"
        style={{ color: 'var(--color-text-primary)' }}>
        {field.label}
        {!field.required && (
          <span className="ml-2 text-xs font-normal"
            style={{ color: 'var(--color-text-muted)' }}>
            (optional)
          </span>
        )}
      </label>
      <input
        type="number"
        min={1}
        max={31}
        value={formValues[field.id] ?? ''}
        onChange={e => {
          const val = parseInt(e.target.value)
          if (!e.target.value || (val >= 1 && val <= 31)) {
            setFormValues(prev => ({ ...prev, [field.id]: e.target.value }))
          }
        }}
        placeholder="e.g. 15"
        className="w-full px-3 py-2.5 font-body text-sm border outline-none"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-primary)',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
        onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
      />
    </div>
  )
```

---

## TASK 4 — Update Birthday Automation Runner

Open `src/lib/automation-runners/birthday.ts`.

Update `runBirthdayAutomation` to check for BOTH the old DATE field pattern AND the new BIRTHDAY_MONTH + BIRTHDAY_DAY fields:

```typescript
export async function runBirthdayAutomation(): Promise<string> {
  try {
    const today = new Date()
    const todayMonth = today.getMonth() + 1  // 1-12
    const todayDay = today.getDate()

    // Get all form submissions with their field values
    const submissions = await db.formSubmission.findMany({
      include: {
        values: { include: { field: true } },
      },
    })

    let sent = 0
    const emailsSent = new Set<string>() // prevent duplicate emails

    for (const submission of submissions) {
      // Strategy 1: Check for BIRTHDAY_MONTH + BIRTHDAY_DAY fields
      const monthValue = submission.values.find(v =>
        v.field.type === 'BIRTHDAY_MONTH'
      )
      const dayValue = submission.values.find(v =>
        v.field.type === 'BIRTHDAY_DAY'
      )

      // Strategy 2: Check for DATE fields with "birth" in label (legacy)
      const dobValue = submission.values.find(v =>
        v.field.type === 'DATE' &&
        (v.field.label.toLowerCase().includes('birth') ||
         v.field.label.toLowerCase().includes('dob'))
      )

      let isBirthday = false

      // Check new BIRTHDAY_MONTH + BIRTHDAY_DAY fields
      if (monthValue?.value && dayValue?.value) {
        const month = parseInt(monthValue.value)
        const day = parseInt(dayValue.value)
        if (month === todayMonth && day === todayDay) {
          isBirthday = true
        }
      }

      // Check legacy DATE field
      if (!isBirthday && dobValue?.value) {
        const dob = new Date(dobValue.value)
        if (!isNaN(dob.getTime())) {
          if (dob.getMonth() + 1 === todayMonth && dob.getDate() === todayDay) {
            isBirthday = true
          }
        }
      }

      if (!isBirthday) continue

      // Get name and email from submission
      const nameValue = submission.values.find(v =>
        v.field.label.toLowerCase().includes('name') &&
        !v.field.label.toLowerCase().includes('last')
      )
      const emailValue = submission.values.find(v =>
        v.field.type === 'EMAIL'
      )

      if (!emailValue?.value) continue
      if (emailsSent.has(emailValue.value.toLowerCase())) continue // skip duplicates

      const name = nameValue?.value?.split(' ')[0] ?? 'Friend'

      await sendEmail({
        to: emailValue.value,
        subject: `Happy Birthday, ${name}! 🎂`,
        html: buildBirthdayEmail(name),
        fromName: EMAIL_SENDERS.hello.name,
        fromEmail: EMAIL_SENDERS.hello.email,
      })

      emailsSent.add(emailValue.value.toLowerCase())
      sent++
    }

    return `${sent} birthday wishes sent`
  } catch (error) {
    console.error('[automation:birthday]', error)
    return `Error: ${error}`
  }
}
```

---

## TASK 5 — Update Form Builder Field Config

Open the form builder where field properties are configured (label, placeholder, required toggle).

For `BIRTHDAY_MONTH` and `BIRTHDAY_DAY` fields:
- Set **required to `false` by default** — these should always be optional
- Hide the placeholder field — not applicable for these types
- Show a note in the builder: *"This field is always optional — visitors choose whether to share their birthday."*

---

## TASK 6 — Update Admin Form Entries Display

Open `src/components/admin/forms/FormEntriesTable.tsx` or the entries display component.

Update the cell renderer to display the new field types nicely:

```typescript
// In the value display function:
case 'BIRTHDAY_MONTH': {
  const months = ['', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  return months[parseInt(value)] ?? value
}

case 'BIRTHDAY_DAY':
  return value ? `Day ${value}` : '—'
```

---

## COMPLETION CHECKLIST

**Schema**
- [ ] `BIRTHDAY_MONTH` added to `FormFieldType` enum
- [ ] `BIRTHDAY_DAY` added to `FormFieldType` enum
- [ ] `npx prisma db push` run

**Form Builder**
- [ ] `BIRTHDAY_MONTH` appears in field type picker with 🎂 icon
- [ ] `BIRTHDAY_DAY` appears in field type picker with 📅 icon
- [ ] Both default to optional (required = false)
- [ ] Note shown in builder: always optional

**Public Form**
- [ ] `BIRTHDAY_MONTH` renders as dropdown (January–December)
- [ ] `BIRTHDAY_DAY` renders as number input (1–31)
- [ ] Both show "(optional)" label
- [ ] Month dropdown shows helpful note about birthday wishes
- [ ] Day validates 1–31 only

**Birthday Automation**
- [ ] Checks `BIRTHDAY_MONTH` + `BIRTHDAY_DAY` fields
- [ ] Still checks legacy `DATE` fields with "birth" label (backward compatible)
- [ ] Duplicate email prevention (same person in multiple forms)
- [ ] Sends birthday email when match found

**Admin Entries**
- [ ] Month value displays as name (e.g. "May" not "5")
- [ ] Day value displays as "Day 15" not raw number

**Build**
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- Both fields are **always optional** — never required. Birthday is a gift to share, not a gate.
- The `BIRTHDAY_MONTH` stores the month as a number string (`"1"` to `"12"`) — simpler to compare.
- The `BIRTHDAY_DAY` stores the day as a number string (`"1"` to `"31"`).
- The automation uses `parseInt()` to compare with `today.getMonth() + 1` and `today.getDate()`.
- The duplicate prevention (`emailsSent` Set) handles cases where someone submitted multiple forms — they should only get one birthday email.
- Backward compatibility: the legacy DATE field check still works so existing volunteer forms with a DOB field continue to trigger birthday wishes.
- After deploying, update the volunteer form in admin to replace the old DATE/DOB field with the new `BIRTHDAY_MONTH` + `BIRTHDAY_DAY` fields.
