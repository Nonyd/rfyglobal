# ROOM FOR YOU — Testimony Form Update Cursor Prompt
## Open Submissions · Optional Edition · Join CTA in Confirmation Email

---

## CONTEXT

Three changes to the testimony submission system:

1. **Remove member-only restriction** — anyone can submit a testimony, not just registered members
2. **Edition field is optional** — the "Room For You event edition" field should not be required
3. **Join CTA in confirmation email** — add a "Join the Community" button linking to `rfyglobal.org/join` in the testimony confirmation email

---

## TASK 1 — Remove Member-Only Restriction

Open `src/app/api/testimonies/route.ts` (POST handler).

Find any check that validates the submitter is a registered member — something like:

```typescript
// Remove or comment out any logic like this:
const member = await db.member.findFirst({ where: { email: body.email } })
if (!member) {
  return NextResponse.json({ error: 'You must be a member to submit a testimony' }, { status: 403 })
}
```

Remove it entirely. Anyone with a name and email should be able to submit.

---

## TASK 2 — Make Edition Field Optional

### Schema
Open `prisma/schema.prisma`.

Find the `Testimony` model and ensure `edition` is optional:

```prisma
model Testimony {
  // ... existing fields ...
  edition  String?   // Make optional if not already
}
```

If you changed the schema, run: `npx prisma db push`

### Zod Validation
Open the testimony validation schema (likely in `src/lib/validations/testimony.ts` or inline in the route).

Update `edition` to be optional:

```typescript
const TestimonySchema = z.object({
  // ... existing fields ...
  edition: z.string().optional().nullable().or(z.literal('')),
})
```

### Public Form UI
Open the public testimony form component.

Find the edition input field and:
1. Remove `required` attribute
2. Remove any `*` required indicator next to the label
3. Update the label to indicate it's optional:

```typescript
<label>
  Room For You Edition
  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
    (optional)
  </span>
</label>
<input
  // Remove: required
  placeholder="e.g. April 2024 Edition"
  // ... rest of props
/>
```

---

## TASK 3 — Add Join CTA to Confirmation Email

Open the testimony confirmation email — find where the email is sent after a successful testimony submission. Check:
- `src/lib/email-senders.ts`
- `src/app/api/testimonies/route.ts`
- Any email template for testimonies

Add a "Join the Community" CTA button after the thank you message and before the email footer:

```html
<!-- Join CTA block — add after the thank you/confirmation message -->
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
```

Place this block:
- **After** the testimony confirmation/thank you message
- **Before** the email footer (the "Room For You · rfyglobal.org" line)

---

## COMPLETION CHECKLIST

- [ ] Member-only restriction removed from testimony POST handler
- [ ] Anyone can submit a testimony regardless of membership status
- [ ] `edition` field is `String?` (optional) in Prisma schema
- [ ] `npx prisma db push` run if schema changed
- [ ] `edition` is optional in Zod validation schema
- [ ] Edition field in public form has no `required` attribute
- [ ] Edition field label shows "(optional)"
- [ ] Confirmation email has "Join the Community →" button
- [ ] Button links to `https://rfyglobal.org/join`
- [ ] Button is placed after thank you message, before footer
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The member restriction removal is the most important change — currently non-members get a 403 when submitting. This should be a simple removal of the member lookup and guard.
- The `edition` field stores which Room For You event/gathering the person's miracle happened at. It's helpful context but should never block someone from sharing their testimony.
- Empty string for `edition` should be treated as `null` when saving — use `edition: body.edition || null` in the DB write.
- The Join CTA in the email is an invitation, not a requirement. Keep the tone warm — the person just shared something personal.
- The email styling uses `background:#1A1A1A` and `#E8001C` — consistent with the Room For You brand. Adjust if the existing email template uses different base colors.
