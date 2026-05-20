# ROOM FOR YOU — Urgent Fix
## Homepage Broken — env.ts Running Client-Side

---

## PROBLEM

The homepage (`rfyglobal.org`) is showing "Application error" in production. The browser console shows:

```
Error: Missing required environment variables:
  - DATABASE_URL
  - NEXTAUTH_SECRET
  - NEXTAUTH_URL
  - NEXT_PUBLIC_APP_URL
  - CREDENTIALS_ENCRYPTION_KEY
  - CLOUDINARY_CLOUD_NAME
  - CLOUDINARY_API_KEY
  - CLOUDINARY_API_SECRET
  - UPSTASH_REDIS_REST_URL
  - UPSTASH_REDIS_REST_TOKEN
```

This error is running in the **browser** (client-side JavaScript), not on the server. Environment variables like `DATABASE_URL` are never available in the browser — this is a server-only check.

The error file is `365-08e66559a9ae1df4.js` which is a client bundle — meaning `src/lib/env.ts` (or something that imports it) has been bundled into client-side JavaScript.

---

## ROOT CAUSE

The recent CMS update added content-fetching functions to `src/lib/content.ts`. These functions import `db` from `@/lib/db`, which imports `env.ts`, which throws the error when it runs in the browser.

Some client component is now importing from `src/lib/content.ts` or a file that chains to `src/lib/env.ts`.

---

## TASK 1 — Find the Import Chain

Do a global search for files that import from `@/lib/content`, `@/lib/db`, or `@/lib/env`:

```
Search: from '@/lib/content'
Search: from '@/lib/db'
Search: from '@/lib/env'
```

For each file found, check if it has `'use client'` at the top. Any `'use client'` file importing these is the problem.

Also check the homepage components added in the CMS update:
- `src/app/(public)/page.tsx` and its child components
- `src/components/(public)/home/` — any new components added
- Any component that uses CMS content on the public site

---

## TASK 2 — Fix the Data Flow

The correct pattern for CMS content in Next.js App Router:

**✅ CORRECT — Server Component fetches data, passes as props:**
```typescript
// src/app/(public)/page.tsx — Server Component (no 'use client')
import { getContent } from '@/lib/content'

export default async function HomePage() {
  const content = await getContent() // Server-side only
  return <Hero content={content} /> // Pass as props to client component
}

// src/components/home/Hero.tsx — Client Component receives props
'use client'
export function Hero({ content }: { content: Record<string, string> }) {
  // Uses content from props, never imports db or env
}
```

**❌ WRONG — Client Component imports db/content directly:**
```typescript
'use client'
import { getContent } from '@/lib/content' // BREAKS — bundles db into client
```

---

## TASK 3 — Fix All Affected Components

For every component in the CMS update that was changed to fetch content:

1. If it has `'use client'` → remove the direct import of `getContent` / `db` / `env`
2. Move the data fetching to the nearest Server Component parent
3. Pass the content down as props

The homepage components are the priority — fix these first:
- `src/app/(public)/page.tsx`
- `src/components/(public)/home/Hero.tsx` or similar
- `src/components/(public)/home/VisionSection.tsx` or similar
- Any other component on the homepage that was updated in the CMS wiring

---

## TASK 4 — Protect env.ts from Client Bundles

Open `src/lib/env.ts`.

Add a server-only guard at the top:

```typescript
import 'server-only' // This package prevents the module from being imported in client bundles
```

If `server-only` is not installed:
```bash
npm install server-only
```

This will cause a build error if any client component tries to import `env.ts` — catching the problem at build time instead of runtime.

---

## TASK 5 — Verify Fix

After fixing, run:
```bash
npm run build
```

The build must:
1. Complete successfully
2. Show NO warnings about `env.ts` or `db` in client bundles
3. The homepage must load without errors in the browser

---

## COMPLETION CHECKLIST

- [ ] `server-only` added to `src/lib/env.ts`
- [ ] No client component imports `@/lib/content`, `@/lib/db`, or `@/lib/env` directly
- [ ] All CMS content fetching happens in Server Components
- [ ] Content passed as props to Client Components
- [ ] Homepage loads without "Missing required environment variables" error
- [ ] All other public pages load correctly
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- `server-only` is a Next.js official package that marks a module as server-only. If imported in a client bundle, the build fails with a clear error. Install it with `npm install server-only` and add `import 'server-only'` as the first line of `src/lib/env.ts` and `src/lib/db.ts`.
- The App Router pattern: Server Components fetch data → pass to Client Components as props. Client Components never import server modules.
- The homepage was working before the CMS update — the CMS update introduced the client-side import. Focus on what changed in that update.
- `src/lib/content.ts` itself is fine as a server module. The problem is a client component importing it directly.
