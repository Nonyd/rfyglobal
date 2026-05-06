# ROOM FOR YOU — Phase 14b Cursor Prompt
## Fix: Event Slug Nullable TypeScript Error

---

## CONTEXT

Build is failing with this TypeScript error:

```
Type 'string | null' is not assignable to type 'string'.
Type 'null' is not assignable to type 'string'.
```

The `slug` field on the `Event` model is now `String?` (nullable) in Prisma schema, but the `PublicEvent` interface and related components expect `slug: string` (non-nullable). Every reference to `event.slug` needs to handle the nullable case.

---

## TASK 1 — Fix PublicEvent Interface

Open `src/components/events/EventsClientPage.tsx`.

Find the `PublicEvent` interface and change:

```typescript
// BEFORE:
slug: string

// AFTER:
slug: string | null
```

---

## TASK 2 — Fix Slug Usage in EventsClientPage

In the same file, find every place `event.slug` is used as a link href and add a null check:

```typescript
// BEFORE:
href={`/events/${event.slug}`}

// AFTER:
href={event.slug ? `/events/${event.slug}` : '#'}
```

---

## TASK 3 — Fix Events Public Page

Open `src/app/(public)/events/page.tsx`.

If there is a type annotation or interface that references `slug: string`, change it to `slug: string | null`.

---

## TASK 4 — Fix SingleEventClient

Open `src/components/events/SingleEventClient.tsx`.

Find the `otherEvents` type — if it uses `Event` from Prisma directly, `slug` will already be `string | null`. Check any link using `e.slug`:

```typescript
// BEFORE:
href={`/events/${e.slug}`}

// AFTER:
href={e.slug ? `/events/${e.slug}` : '#'}
```

---

## TASK 5 — Fix Any Other Slug References

Do a global search in `src/` for `event.slug` and `e.slug` used inside template literals or href props. Apply the null check pattern to every occurrence:

```typescript
// Pattern to fix:
`/events/${event.slug}`  →  event.slug ? `/events/${event.slug}` : '#'
`/events/${e.slug}`      →  e.slug ? `/events/${e.slug}` : '#'
```

---

## COMPLETION CHECKLIST

- [ ] `PublicEvent` interface has `slug: string | null`
- [ ] All `href` props using `event.slug` have null checks
- [ ] `npm run build` passes without TypeScript errors
- [ ] Push to main to trigger Vercel redeploy

---

## NOTES FOR CURSOR

- The slug is nullable because existing events in the database had no slug when the column was added. New events created going forward will always have a slug (generated automatically in the API). The `href="#"` fallback for null slugs is a safe temporary measure — those old events will get slugs added manually via Prisma Studio.
- Do not change the Prisma schema — `slug String? @unique` on Event is correct and intentional.
