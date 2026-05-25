# ROOM FOR YOU — Testimony Smart Join CTA Cursor Prompt
## Auto-detect non-members and show Join CTA only to them

---

## CONTEXT

After a testimony is submitted, the system should check if the submitter's email is already a registered community member. 

- **If NOT a member** → confirmation email includes the "Join the Community →" button AND the success screen on the public site redirects to `rfyglobal.org/join` after a short delay
- **If already a member** → confirmation email is a simple thank you, no join CTA, no redirect

---

## TASK 1 — Check Membership in Testimony API

Open `src/app/api/testimony/route.ts`.

After saving the testimony successfully, check if the submitter is a member:

```typescript
// After db.testimony.create():
const isMember = await db.member.findFirst({
  where: { email: body.email.toLowerCase().trim() },
  select: { id: true },
})

const isNewVisitor = !isMember
```

Pass `isNewVisitor` to the email sending function and return it in the response:

```typescript
// In the API response:
return NextResponse.json({
  success: true,
  isNewVisitor,  // frontend uses this to decide whether to redirect
})
```

---

## TASK 2 — Conditional Email

Open `src/lib/emails/testimony-confirmation.ts`.

Update the email function to accept `isNewVisitor` and conditionally include the Join CTA block:

```typescript
export function buildTestimonyConfirmationEmail({
  name,
  isNewVisitor,
}: {
  name: string
  isNewVisitor: boolean
}) {
  const joinBlock = isNewVisitor ? `
    <div style="text-align:center;margin:32px 0;padding:24px;background:#1A1A1A;border-top:2px solid #E8001C;">
      <p style="font-family:Arial,sans-serif;font-size:13px;color:#A0A0A0;margin:0 0 16px;">
        Want to be part of the Room For You community?
      </p>
      <a
        href="https://rfyglobal.org/join"
        style="display:inline-block;background:#E8001C;color:#ffffff;padding:12px 32px;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;"
      >
        Join the Community →
      </a>
      <p style="font-family:Arial,sans-serif;font-size:11px;color:#585858;margin:12px 0 0;">
        rfyglobal.org/join
      </p>
    </div>
  ` : ''

  return {
    subject: 'Thank you for sharing your testimony',
    html: `
      <!-- ... existing email HTML ... -->
      ${joinBlock}
      <!-- ... footer ... -->
    `
  }
}
```

---

## TASK 3 — Frontend Redirect for Non-Members

Open `src/components/(public)/testimonies/TestimonySubmitModal.tsx` or wherever the success state is shown after submission.

After a successful submission, check `isNewVisitor` from the API response:

```typescript
const data = await res.json()

if (data.success) {
  if (data.isNewVisitor) {
    // Show success message briefly, then redirect to join page
    setSuccess(true)
    setSuccessMessage('Thank you for sharing! Redirecting you to join our community...')
    setTimeout(() => {
      window.location.href = 'https://rfyglobal.org/join'
    }, 3000) // 3 second delay so they can read the success message
  } else {
    // Already a member — just show thank you
    setSuccess(true)
    setSuccessMessage('Thank you for sharing your testimony!')
  }
}
```

In the success UI, if `isNewVisitor` is true, show a countdown or note:

```typescript
{isNewVisitor && (
  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
    Redirecting you to join the community in 3 seconds…
    <button
      onClick={() => window.location.href = 'https://rfyglobal.org/join'}
      style={{ color: 'var(--color-accent)', marginLeft: '0.5rem', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}
    >
      Go now →
    </button>
  </p>
)}
```

---

## COMPLETION CHECKLIST

- [ ] Testimony API checks if submitter email exists in `Member` table
- [ ] `isNewVisitor` returned in API response
- [ ] Confirmation email includes Join CTA only when `isNewVisitor` is true
- [ ] Confirmation email is a simple thank you when submitter is already a member
- [ ] Success screen redirects to `/join` after 3 seconds for non-members
- [ ] "Go now →" skip link available for non-members
- [ ] No redirect for existing members
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- Member lookup uses case-insensitive email match — use `.toLowerCase().trim()` on both sides
- The 3-second delay gives the person time to read the success message before redirect
- The redirect only happens after a successful submission — not on error
- This is a gentle nudge, not a forced redirect — the "Go now →" link and the 3-second window make it feel human
- If the member DB lookup fails (network error etc.), default `isNewVisitor` to `false` so existing members are not accidentally redirected
