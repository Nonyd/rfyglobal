# ROOM FOR YOU — Phase 26c Cursor Prompt
## Fix Social Media Handles Across the Platform

---

## CONTEXT

The correct social media handles for Room For You are:
- **Instagram:** @rfyglobal (was @roomforyouyadah)
- **X (Twitter):** @rfyglobal (was @roomforyou)
- **YouTube:** Yadah ✅ (correct — no change)

Update every place these handles appear across the codebase.

---

## TASK 1 — Update llms.txt

Open `public/llms.txt`.

Find and replace:
```
## Social Media
- Instagram: @roomforyouyadah
- YouTube: Yadah
- X (Twitter): @roomforyou
```

Replace with:
```
## Social Media
- Instagram: @rfyglobal
- YouTube: Yadah
- X (Twitter): @rfyglobal
```

---

## TASK 2 — Update Root Layout Metadata

Open `src/app/layout.tsx`.

Find any references to the old handles in the metadata and update:

```typescript
// BEFORE:
twitter: {
  creator: '@roomforyou',
  site: '@roomforyou',
  // ...
}

// AFTER:
twitter: {
  creator: '@rfyglobal',
  site: '@rfyglobal',
  // ...
}
```

Also update `sameAs` in the Organization JSON-LD schema:

```typescript
// BEFORE:
sameAs: [
  'https://instagram.com/roomforyouyadah',
  'https://youtube.com/@yadah',
  'https://x.com/roomforyou',
],

// AFTER:
sameAs: [
  'https://instagram.com/rfyglobal',
  'https://youtube.com/@yadah',
  'https://x.com/rfyglobal',
],
```

---

## TASK 3 — Update About Page Schema

Open `src/app/(public)/about/page.tsx`.

Find the Minister Yadah Person schema `sameAs` array and update any Room For You social links:

```typescript
// Update RFY social links in the person schema:
sameAs: [
  'https://instagram.com/rfyglobal',  // was roomforyouyadah
  'https://youtube.com/@yadah',
  'https://x.com/rfyglobal',  // was roomforyou
  'https://yadahworld.com',
],
```

---

## TASK 4 — Update Footer Social Links

Open `src/components/layout/FooterInteractive.tsx` or `src/components/layout/Footer.tsx`.

Find the social media links in the footer and update the `href` values:

```typescript
// BEFORE:
{ href: 'https://instagram.com/roomforyouyadah', ... }
{ href: 'https://x.com/roomforyou', ... }

// AFTER:
{ href: 'https://instagram.com/rfyglobal', ... }
{ href: 'https://x.com/rfyglobal', ... }
```

---

## TASK 5 — Update Contact Page

Open `src/components/contact/ContactClient.tsx`.

Find the social links array and update:

```typescript
// BEFORE:
{ href: content['contact.instagram'] || 'https://instagram.com/roomforyou', handle: '@roomforyou' }
{ href: content['contact.twitter'] || 'https://x.com/roomforyou', handle: '@roomforyou' }

// AFTER:
{ href: content['contact.instagram'] || 'https://instagram.com/rfyglobal', handle: '@rfyglobal' }
{ href: content['contact.twitter'] || 'https://x.com/rfyglobal', handle: '@rfyglobal' }
```

---

## TASK 6 — Update CMS Default Values

Open `src/lib/content.ts`.

Find any default values for contact social links and update:

```typescript
// BEFORE:
'contact.instagram': 'https://instagram.com/roomforyouyadah',
'contact.twitter': 'https://x.com/roomforyou',

// AFTER:
'contact.instagram': 'https://instagram.com/rfyglobal',
'contact.twitter': 'https://x.com/rfyglobal',
```

---

## TASK 7 — Search and Replace All Remaining Instances

Do a global search across the entire codebase for these strings and replace:

| Find | Replace |
|------|---------|
| `roomforyouyadah` | `rfyglobal` |
| `instagram.com/roomforyou` | `instagram.com/rfyglobal` |
| `x.com/roomforyou` | `x.com/rfyglobal` |
| `twitter.com/roomforyou` | `twitter.com/rfyglobal` |
| `@roomforyou` | `@rfyglobal` |

**Exception — do NOT change:**
- `youtube.com/@yadah` — YouTube handle is Yadah, not rfyglobal
- Any references to `yadahworld.com`
- Any text inside blog post content or CMS content stored in the database

---

## COMPLETION CHECKLIST

- [ ] `public/llms.txt` shows `@rfyglobal` for Instagram and X
- [ ] Root layout metadata `twitter.creator` and `twitter.site` = `@rfyglobal`
- [ ] Organization JSON-LD `sameAs` uses `instagram.com/rfyglobal` and `x.com/rfyglobal`
- [ ] Footer Instagram link goes to `instagram.com/rfyglobal`
- [ ] Footer X link goes to `x.com/rfyglobal`
- [ ] Contact page default handles show `@rfyglobal`
- [ ] CMS defaults updated to `rfyglobal`
- [ ] YouTube unchanged — still `youtube.com/@yadah`
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- Do a global search (`Ctrl+Shift+F` in VS Code/Cursor) for `roomforyouyadah` and `roomforyou` to catch any instances in files not listed above.
- Be careful not to change `roomforyou` inside the site name "Room For You" — only change social media URLs and handles.
- The CMS values stored in the database (in `SiteContent` table) cannot be updated by code changes — they need to be updated via the admin CMS editor at `/admin/cms` after deployment. Add a note to do this.
- After deploying, go to `/admin/cms` → Contact section → update the Instagram URL to `https://instagram.com/rfyglobal` and X URL to `https://x.com/rfyglobal` — these are the live values served to the contact page.
