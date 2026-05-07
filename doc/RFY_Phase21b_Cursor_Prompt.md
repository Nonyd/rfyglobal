# ROOM FOR YOU — Phase 21b Cursor Prompt
## Fix Build Error · Footer Light Mode · Navbar Logo Size

---

## CONTEXT

Three fixes needed:

1. **Build error** — `onMouseEnter`/`onMouseLeave` handlers crashing static page generation on `/privacy`, `/cookies`, `/refund`, `/unsubscribed`
2. **Footer light mode** — footer showing cream background instead of staying dark
3. **Navbar logo** — increase size in light mode

---

## TASK 1 — Fix Build Error: Ensure 'use client' on Navbar and Footer

**Root cause:** The build error is:
```
Event handlers cannot be passed to Client Component props.
onMouseEnter: function onMouseEnter
```

This means `Navbar.tsx` or `Footer.tsx` is missing `'use client'` at the top, causing event handlers to fail during static generation of server-rendered pages like `/privacy`, `/cookies`, `/refund`, `/unsubscribed`.

**Fix:**

Open `src/components/layout/Navbar.tsx`.

Ensure `'use client'` is the **absolute first line** of the file — before any imports:

```typescript
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
// ... rest of imports
```

Open `src/components/layout/Footer.tsx`.

If Footer has any `onMouseEnter`/`onMouseLeave` handlers, ensure it also has `'use client'` as the first line. If Footer is a server component (async function, fetches data), move the interactive link hover handlers into a separate client sub-component:

```typescript
// Option A — add 'use client' to entire Footer if it has no async data fetching
'use client'

// Option B — if Footer fetches data (async), extract hover links to a client component:
'use client'
function FooterLinks() {
  return (
    <nav>
      {NAV_LINKS.map(link => (
        <a
          key={link.href}
          href={link.href}
          style={{ color: '#585858' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#C9A84C')}
          onMouseLeave={e => (e.currentTarget.style.color = '#585858')}
        >
          {link.label}
        </a>
      ))}
    </nav>
  )
}
```

**After fixing, run `npm run build` locally to confirm it passes before pushing.**

---

## TASK 2 — Footer Always Dark in Light Mode

Open `src/components/layout/Footer.tsx`.

The footer is showing a cream background in light mode because the `.light .bg-void` CSS override in `globals.css` is affecting it.

**Fix — use hardcoded inline background instead of Tailwind class:**

```typescript
// BEFORE (affected by light mode CSS override):
<footer className="bg-void border-t border-ash/40 pt-20 pb-10 px-6">

// AFTER (hardcoded — never affected by theme):
<footer
  className="border-t pt-20 pb-10 px-6"
  style={{
    background: '#0F0F0F',
    borderColor: 'rgba(255,255,255,0.08)',
  }}
>
```

Also ensure all text inside the footer uses hardcoded light colors so they don't change in light mode:

```typescript
// Footer logo — always white:
<img
  src="/images/logo-white.png"
  alt="Room For You"
  style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
/>

// Tagline:
<p style={{ color: 'rgba(248,248,248,0.35)', fontSize: '11px', letterSpacing: '0.3em' }}>
  {content['footer.tagline'] || 'Jesus to Nations — 2 Cor 5:17-21'}
</p>

// Nav links:
style={{ color: '#585858' }}
onMouseEnter={e => (e.currentTarget.style.color = '#C9A84C')}
onMouseLeave={e => (e.currentTarget.style.color = '#585858')}

// Social links:
style={{ color: '#585858' }}
onMouseEnter={e => (e.currentTarget.style.color = '#C9A84C')}
onMouseLeave={e => (e.currentTarget.style.color = '#585858')}

// Gold divider — keep as-is

// Copyright:
style={{ color: '#585858', fontSize: '11px' }}

// Policy links:
style={{ color: '#585858', fontSize: '11px' }}
onMouseEnter={e => (e.currentTarget.style.color = '#C9A84C')}
onMouseLeave={e => (e.currentTarget.style.color = '#585858')}
```

---

## TASK 3 — Navbar Logo Size

Open `src/components/layout/Navbar.tsx`.

Increase the logo size. The logo currently looks too small. Update the `<img>` height:

```typescript
<img
  src={logoSrc}
  alt="Room For You"
  style={{
    height: isDark ? '52px' : '60px',
    width: 'auto',
    objectFit: 'contain',
    display: 'block',
  }}
/>
```

---

## TASK 4 — globals.css: Exclude Footer from Light Mode Overrides

Open `src/app/globals.css`.

Add an exception at the end of the light mode overrides section to prevent footer from being affected:

```css
/* Footer and its children always stay dark regardless of theme */
.light footer,
.light footer .bg-void,
.light footer .text-fog,
.light footer .text-mist,
.light footer .text-snow {
  /* These will be overridden by inline styles on the footer element */
  /* The inline style={{ background: '#0F0F0F' }} on footer takes precedence */
}
```

Note: The inline `style` prop on the footer element already takes precedence over CSS class overrides. The main fix is Task 2 above. This task is just documentation/safety.

---

## COMPLETION CHECKLIST

- [ ] `'use client'` is first line of `Navbar.tsx`
- [ ] `'use client'` is present in `Footer.tsx` OR interactive elements extracted to client sub-component
- [ ] `npm run build` passes with exit code 0
- [ ] No prerender errors on `/privacy`, `/cookies`, `/refund`, `/unsubscribed`
- [ ] Footer shows dark background (`#0F0F0F`) in light mode
- [ ] Footer logo shows white version correctly
- [ ] Footer text uses hardcoded dark-theme colors
- [ ] Navbar logo is larger (52px dark / 60px light)

---

## NOTES FOR CURSOR

- The `'use client'` directive must be the **absolute first line** of the file — no comments, no blank lines before it.
- If `Footer.tsx` is an `async` server component (it fetches CMS content), it cannot have `'use client'`. In that case, extract only the interactive parts (hover links) into a small `FooterLinks` client component, and keep the outer `Footer` as a server component.
- The inline `style={{ background: '#0F0F0F' }}` on the footer `<footer>` element takes precedence over Tailwind classes AND CSS overrides, making it the most reliable way to hardcode the footer background.
- After fixing, verify by toggling light mode on the deployed site — the footer should stay dark while everything above it switches to cream.
