# ROOM FOR YOU — Phase 16b Cursor Prompt
## Portrait Event Image Fix

---

## CONTEXT

All Room For You event images are portrait orientation (taller than wide). The current event single page layout uses `object-cover` with a fixed-height panel, which crops portrait images badly. The fix makes the image panel show the full portrait image with the panel height adjusting to fit it.

---

## TASK 1 — Fix SingleEventClient Image Panel

Open `src/components/events/SingleEventClient.tsx`.

**The current approach** — left panel is a fixed full-screen height with `object-cover`, which aggressively crops portrait images to fill the space.

**The new approach** — on desktop, the left panel uses `object-contain` with a dark background so the full portrait image is always visible. The panel stays sticky but the image is contained within it. On mobile, the image shows at its natural portrait ratio.

```typescript
{/* LEFT — Image panel */}
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 1 }}
  className="relative lg:sticky lg:top-0 lg:self-start"
  style={{ background: '#0A0A0A' }}
>
  {event.imageUrl ? (
    <>
      {/* Mobile: natural portrait ratio */}
      <div className="relative w-full lg:hidden"
        style={{ paddingBottom: '133%' }}> {/* 3:4 portrait ratio */}
        <Image
          src={event.imageUrl}
          alt={event.title}
          fill
          className="object-cover object-top"
          priority
        />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(15,15,15,0.1), rgba(15,15,15,0.5))' }} />
      </div>

      {/* Desktop: full portrait image contained, panel adjusts */}
      <div className="hidden lg:block relative w-full"
        style={{ minHeight: '100vh' }}>
        <Image
          src={event.imageUrl}
          alt={event.title}
          fill
          className="object-contain object-top"
          priority
          style={{ background: '#0A0A0A' }}
        />
        {/* Subtle dark overlay on sides for depth */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, rgba(15,15,15,0.3) 0%, transparent 20%, transparent 80%, rgba(15,15,15,0.3) 100%)',
          }}
        />
      </div>
    </>
  ) : (
    /* Placeholder */
    <div className="relative w-full lg:min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #0F0F0F 100%)', paddingBottom: '133%' }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="font-display font-bold leading-none"
            style={{
              fontSize: 'clamp(5rem, 15vw, 10rem)',
              color: 'transparent',
              WebkitTextStroke: '1px rgba(201,168,76,0.2)',
            }}>
            RFY
          </p>
          <div className="gold-line w-24 mx-auto mt-4 opacity-20" />
        </div>
      </div>
    </div>
  )}

  {/* Date badge — top left, clears the navbar */}
  <div className="absolute top-24 left-6 lg:left-10 z-10">
    <div className="border border-gold/50 px-3 py-2.5 text-center"
      style={{ background: 'rgba(15,15,15,0.85)', backdropFilter: 'blur(8px)' }}>
      <p className="font-display text-3xl text-gold font-bold leading-none">{dayNum}</p>
      <p className="label-text opacity-70 mt-1">{monthShort}</p>
    </div>
  </div>

  {/* Back link — bottom left */}
  <Link
    href="/events"
    className="absolute bottom-6 left-6 lg:bottom-10 lg:left-10 z-10 flex items-center gap-2 font-body text-xs tracking-widest uppercase transition-colors"
    style={{ color: 'rgba(248,248,248,0.6)' }}
    onMouseEnter={e => (e.currentTarget.style.color = '#C9A84C')}
    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(248,248,248,0.6)')}
  >
    <ArrowLeft size={14} />
    All Events
  </Link>
</motion.div>
```

---

## TASK 2 — Fix Event Cards on /events Listing

Open `src/components/events/EventsClientPage.tsx`.

The event cards in the masonry grid also use `object-cover` which will crop portrait images. Fix the card image to use `object-contain` with a dark background:

```typescript
{/* Image area in event card */}
<div className="h-64 overflow-hidden relative"
  style={{ background: '#0F0F0F' }}>
  {event.imageUrl ? (
    <Image
      src={event.imageUrl}
      alt={event.title}
      fill
      className="object-contain group-hover:scale-105 transition-transform duration-500"
    />
  ) : (
    <div className="flex items-center justify-center h-full">
      <span className="font-display text-4xl font-bold"
        style={{ color: 'transparent', WebkitTextStroke: '1px rgba(201,168,76,0.2)' }}>
        RFY
      </span>
    </div>
  )}
  {/* Date badge */}
  <div className="absolute top-4 left-4 bg-void/90 border border-gold/30 px-3 py-2 text-center z-10">
    <p className="font-display text-2xl text-gold font-bold leading-none">
      {format(new Date(event.date), 'dd')}
    </p>
    <p className="label-text opacity-60">
      {format(new Date(event.date), 'MMM').toUpperCase()}
    </p>
  </div>
</div>
```

---

## TASK 3 — Fix "Coming Up" Cards on Single Event Page

Open `src/components/events/SingleEventClient.tsx` — the `otherEvents` grid at the bottom.

Same fix for the other event cards:

```typescript
{/* Image or placeholder in other events cards */}
<div className="h-52 relative overflow-hidden"
  style={{ background: '#1A1A1A' }}>
  {e.imageUrl ? (
    <Image
      src={e.imageUrl}
      alt={e.title}
      fill
      className="object-contain group-hover:scale-105 transition-opacity duration-300"
    />
  ) : (
    <div className="flex items-center justify-center h-full">
      <span className="font-display text-3xl font-bold"
        style={{ color: 'transparent', WebkitTextStroke: '1px rgba(201,168,76,0.2)' }}>
        RFY
      </span>
    </div>
  )}
  {/* Date badge */}
  <div className="absolute top-3 left-3 bg-void/90 border border-gold/30 px-2 py-1.5 text-center z-10">
    <p className="font-display text-xl text-gold font-bold leading-none">
      {format(new Date(e.date), 'dd')}
    </p>
    <p className="label-text opacity-60 text-[9px]">
      {format(new Date(e.date), 'MMM').toUpperCase()}
    </p>
  </div>
</div>
```

---

## TASK 4 — Update Gallery Admin Image Display

While we are fixing portrait images, also update the gallery admin masonry grid in `src/components/admin/gallery/GalleryManager.tsx` to use `object-contain` so uploaded portrait photos are not cropped in the admin view:

```typescript
<Image
  src={img.url}
  alt={img.caption ?? img.eventName ?? 'Room For You event'}
  width={600}
  height={400}
  className={cn(
    'w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105',
    !img.isActive && 'opacity-40'
  )}
  style={{ background: '#1A1A1A' }}
/>
```

---

## COMPLETION CHECKLIST

- [ ] Event single page left panel shows full portrait image without cropping
- [ ] Date badge is positioned below the navbar (not hidden behind it)
- [ ] Back link visible at bottom of image panel
- [ ] Dark background behind image (no white flash on contain)
- [ ] Event listing cards (`/events`) show portrait images correctly
- [ ] "Coming up" cards on single event page show portrait images correctly
- [ ] Mobile view: portrait image shows at natural ratio
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- `object-contain` on a dark (`#0A0A0A`) background is the correct approach for portrait images — the full image is visible with dark letterboxing on the sides rather than cropping.
- The `h-64` on event listing cards should be increased to `h-80` or even `h-96` to give portrait images enough vertical space to look good with `object-contain`.
- On the single event page desktop left panel, `min-height: 100vh` with `object-contain` and `object-top` alignment means the portrait image fills from the top down, which is the most natural presentation for event poster images.
- `scale-105` on hover still works with `object-contain` — it just scales the contained image slightly.
- Do not use `object-cover` anywhere for event images going forward — all Room For You event images are portrait format.
