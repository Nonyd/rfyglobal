# ROOM FOR YOU — Phase 36b Cursor Prompt
## Event Registration Redirect URL

---

## CONTEXT

Add the same redirect URL feature from Phase 36 (forms) to event registration. Admin can optionally set a URL to redirect visitors to after successful event registration, instead of showing the default success message.

**Behaviour:**
- If `redirectUrl` is set on the event → redirect visitor to that URL after registration
- If `redirectUrl` is empty → show the default success/confirmation message (existing behaviour)

---

## TASK 1 — Prisma Schema

Open `prisma/schema.prisma`.

Add `redirectUrl` to the `Event` model:

```prisma
model Event {
  // ... existing fields ...
  redirectUrl  String?   // Optional URL to redirect after registration
}
```

Run: `npx prisma db push`

---

## TASK 2 — Update Event API Routes

### Create/Update event
Open `src/app/api/events/route.ts` (POST) and `src/app/api/events/[id]/route.ts` (PATCH).

Ensure `redirectUrl` is accepted and saved:

```typescript
// In the create/update body parsing:
const { redirectUrl, ...otherFields } = body

await db.event.create({
  data: {
    ...otherFields,
    redirectUrl: redirectUrl || null,
  },
})

// Same for update:
await db.event.update({
  where: { id },
  data: {
    ...otherFields,
    redirectUrl: redirectUrl || null,
  },
})
```

### Registration submit
Open `src/app/api/events/[id]/register/route.ts`.

After successful registration, include `redirectUrl` in the response:

```typescript
// Fetch the event to get redirectUrl:
const event = await db.event.findUnique({
  where: { id: params.id },
  select: { redirectUrl: true, title: true },
})

return NextResponse.json({
  success: true,
  message: `You are registered for ${event?.title ?? 'this event'}!`,
  redirectUrl: event?.redirectUrl ?? null,
})
```

---

## TASK 3 — Admin Event Form UI

Open the event create/edit form in the admin — `src/components/admin/events/EventsManager.tsx` or `src/app/admin/(dashboard)/events/[id]/edit/page.tsx` or wherever event fields are configured.

Find the section with event settings and add a **Redirect URL** field after the success/confirmation message field (or in a new "After Registration" section):

```typescript
{/* After Registration Section */}
<div className="border-t pt-5 mt-5" style={{ borderColor: 'var(--a-border)' }}>
  <p
    className="font-body text-xs uppercase tracking-widest font-semibold mb-4"
    style={{ color: 'var(--a-text-muted)' }}
  >
    After Registration
  </p>

  <div>
    <label
      className="font-body text-sm font-medium block mb-1.5"
      style={{ color: 'var(--a-text)' }}
    >
      Redirect URL
      <span className="ml-2 font-normal text-xs" style={{ color: 'var(--a-text-muted)' }}>
        (optional)
      </span>
    </label>
    <input
      type="url"
      value={eventData.redirectUrl ?? ''}
      onChange={e =>
        setEventData(prev => ({
          ...prev,
          redirectUrl: e.target.value || null,
        }))
      }
      placeholder="https://rfyglobal.org/events"
      className="w-full px-3 py-2.5 font-body text-sm border outline-none"
      style={{
        background: 'var(--a-bg)',
        borderColor: 'var(--a-border)',
        color: 'var(--a-text)',
      }}
      onFocus={e => (e.target.style.borderColor = 'var(--a-gold)')}
      onBlur={e => (e.target.style.borderColor = 'var(--a-border)')}
    />
    <p
      className="font-body text-xs mt-1.5 leading-relaxed"
      style={{ color: 'var(--a-text-muted)' }}
    >
      Redirect visitors to this URL after successful registration. Leave empty
      to show the default confirmation message.
    </p>
  </div>
</div>
```

Ensure `redirectUrl` is included in the save/update request body.

---

## TASK 4 — Public Event Registration Modal

Open the event registration modal or form component — likely `src/components/(public)/events/EventRegistrationModal.tsx` or similar.

After a successful registration response, check for `redirectUrl`:

```typescript
const data = await res.json()

if (!res.ok) {
  // handle error as before
  return
}

// Check for redirect
if (data.redirectUrl) {
  window.location.href = data.redirectUrl
  return
}

// No redirect — show success message as before
setSuccess(true)
setSuccessMessage(data.message ?? 'Registration successful!')
```

---

## COMPLETION CHECKLIST

**Database**
- [ ] `Event.redirectUrl` field added to schema (`String?`)
- [ ] `npx prisma db push` succeeds

**Admin UI**
- [ ] Redirect URL input field in event create/edit form
- [ ] Under "After Registration" section
- [ ] Placeholder shows example URL
- [ ] Helper text explains behaviour
- [ ] Value saves when event is created or updated
- [ ] Existing events with no redirect show empty field

**API**
- [ ] `POST /api/events` accepts and saves `redirectUrl`
- [ ] `PATCH /api/events/[id]` accepts and saves `redirectUrl`
- [ ] `POST /api/events/[id]/register` returns `{ success, message, redirectUrl }`

**Public Event Page**
- [ ] After registration, checks `redirectUrl` in response
- [ ] If present → `window.location.href = redirectUrl`
- [ ] If absent → shows success message as before

**Build**
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- `redirectUrl` is `String?` — optional, nullable. Existing events will have `null` and continue showing the success message. No data migration needed.
- The redirect happens via `window.location.href` — works for both same-origin and external URLs.
- Empty string should be treated as `null` (no redirect) — use `redirectUrl || null` when saving.
- After `npx prisma db push`, the new column is added. Existing event records will have `NULL` automatically.
- This is the exact same pattern as Phase 36 (form redirect) — apply consistently.
