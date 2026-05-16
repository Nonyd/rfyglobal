# ROOM FOR YOU — Phase 36 Cursor Prompt
## Form Redirect URL After Submission

---

## CONTEXT

Add a **Redirect URL** field to the form builder so admin can optionally set a URL to redirect visitors to after a successful form submission, instead of showing the default thank you message.

**Behaviour:**
- If `redirectUrl` is set → redirect visitor to that URL after submission
- If `redirectUrl` is empty → show the default thank you message (existing behaviour)

---

## TASK 1 — Prisma Schema

Open `prisma/schema.prisma`.

Add `redirectUrl` to the `Form` model:

```prisma
model Form {
  // ... existing fields ...
  redirectUrl  String?   // Optional URL to redirect after submission
}
```

Run: `npx prisma db push`

---

## TASK 2 — Update Form Validation Schema

Open `src/lib/validations/form.ts` or wherever the form Zod schema is defined.

Add `redirectUrl` to the update schema:

```typescript
export const UpdateFormSchema = z.object({
  // ... existing fields ...
  redirectUrl: z.string().url().optional().nullable().or(z.literal('')),
})
```

---

## TASK 3 — Update Form Builder UI

Open `src/components/admin/forms/FormBuilderEditor.tsx` or the form settings panel.

Find the section where form settings are configured (title, description, submit button text, success message, etc.) and add a **Redirect URL** field in an "After Submission" section:

```typescript
{/* After Submission Section */}
<div className="border-t pt-6" style={{ borderColor: 'var(--a-border)' }}>
  <p className="font-body text-xs uppercase tracking-widest font-semibold mb-4"
    style={{ color: 'var(--a-text-muted)' }}>
    After Submission
  </p>

  {/* Success message — existing field, keep unchanged */}

  {/* Redirect URL — new field */}
  <div className="mt-4">
    <label className="font-body text-sm font-medium block mb-1.5"
      style={{ color: 'var(--a-text)' }}>
      Redirect URL
      <span className="ml-2 font-normal text-xs" style={{ color: 'var(--a-text-muted)' }}>
        (optional)
      </span>
    </label>
    <input
      type="url"
      value={formData.redirectUrl ?? ''}
      onChange={e => setFormData(prev => ({
        ...prev,
        redirectUrl: e.target.value || null,
      }))}
      placeholder="https://rfyglobal.org/join"
      className="w-full px-3 py-2.5 font-body text-sm border outline-none"
      style={{
        background: 'var(--a-bg)',
        borderColor: 'var(--a-border)',
        color: 'var(--a-text)',
      }}
      onFocus={e => (e.target.style.borderColor = 'var(--a-gold)')}
      onBlur={e => (e.target.style.borderColor = 'var(--a-border)')}
    />
    <p className="font-body text-xs mt-1.5 leading-relaxed"
      style={{ color: 'var(--a-text-muted)' }}>
      Leave empty to show the thank you message. Enter a URL to redirect visitors
      to a different page after submission (e.g. a custom thank you page or the
      community join page).
    </p>
  </div>
</div>
```

Ensure `redirectUrl` is included when saving the form — it should be part of the PATCH request body sent to `/api/forms/[id]`.

---

## TASK 4 — Update Form Submit API

Open `src/app/api/forms/[id]/submit/route.ts`.

After a successful submission, include `redirectUrl` in the response:

```typescript
// After saving the submission:
const form = await db.form.findUnique({
  where: { id: params.id },
  select: { redirectUrl: true, successMessage: true },
})

return NextResponse.json({
  success: true,
  message: form?.successMessage ?? 'Thank you for your submission!',
  redirectUrl: form?.redirectUrl ?? null,
})
```

---

## TASK 5 — Update Public Form Renderer

Open `src/components/forms/PublicFormRenderer.tsx`.

Find the submission handler and update it to redirect if `redirectUrl` is present:

```typescript
const handleSubmit = async () => {
  // ... existing validation ...

  try {
    const res = await fetch(`/api/forms/${form.slug}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formValues),
    })

    const data = await res.json()

    if (!res.ok) {
      // handle error
      return
    }

    // Check for redirect
    if (data.redirectUrl) {
      window.location.href = data.redirectUrl
      return
    }

    // No redirect — show thank you message (existing behaviour)
    setSubmitted(true)
    setSuccessMessage(data.message ?? 'Thank you for your submission!')
  } catch (error) {
    // handle error
  }
}
```

---

## TASK 6 — Update Form API to Return redirectUrl

Open `src/app/api/forms/[id]/route.ts` (GET handler).

Ensure `redirectUrl` is included in the form data returned to the admin:

```typescript
const form = await db.form.findUnique({
  where: { id },
  include: { fields: { orderBy: { order: 'asc' } } },
})
// redirectUrl is already included since it's a direct field on Form
return NextResponse.json(form)
```

No change needed if you already return the full form object — `redirectUrl` will be included automatically.

---

## COMPLETION CHECKLIST

**Database**
- [ ] `Form.redirectUrl` field added to schema
- [ ] `npx prisma db push` succeeds

**Admin UI**
- [ ] Redirect URL input field shows in form builder settings
- [ ] Field is under "After Submission" section
- [ ] Placeholder shows an example URL
- [ ] Helper text explains the behaviour
- [ ] Value saves correctly when form is saved
- [ ] Existing forms with no redirect URL show empty field

**Public Form**
- [ ] After submission, checks for `redirectUrl` in response
- [ ] If `redirectUrl` present → `window.location.href = redirectUrl`
- [ ] If no `redirectUrl` → shows thank you message as before
- [ ] No change to existing thank you message behaviour

**Build**
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The `redirectUrl` field is optional (`String?`) — existing forms without it will have `null` and continue showing the thank you message. No migration needed for existing data.
- The redirect happens client-side via `window.location.href` — this is intentional so it works with both same-origin and external URLs.
- Validate the URL format in the Zod schema but make it optional — an empty string should be treated as null (no redirect).
- The admin can set it to any URL — e.g. `https://rfyglobal.org/join` to send form submitters to the join page, or a custom external thank you page.
- After `npx prisma db push`, the new column is added to the DB. Existing form records will have `NULL` for `redirectUrl` which is correct.
