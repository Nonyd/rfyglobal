# ROOM FOR YOU — Phase 16d Cursor Prompt
## Event Single Page Redesign — Centered Contained Layout

---

## CONTEXT

The current event single page stretches edge-to-edge and the portrait image is partially cut off. The new design is centered and contained — the poster image and event details sit together in the middle of the screen like a focused editorial card. The image stays sticky on desktop while details scroll.

---

## TASK 1 — Rewrite SingleEventClient Layout

Completely replace the hero section layout in `src/components/events/SingleEventClient.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Clock, Calendar, ArrowLeft, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { EventRegistrationModal } from '@/components/events/EventRegistrationModal'
import type { Event } from '@prisma/client'
import type { EventFormField } from '@prisma/client'

interface SingleEventClientProps {
  event: Event
  otherEvents: Event[]
  fields: EventFormField[]
}

export function SingleEventClient({ event, otherEvents, fields }: SingleEventClientProps) {
  const [registrationOpen, setRegistrationOpen] = useState(false)

  const dateFormatted = format(new Date(event.date), 'EEEE, MMMM do yyyy')
  const monthShort = format(new Date(event.date), 'MMM').toUpperCase()
  const dayNum = format(new Date(event.date), 'dd')
  const isPast = new Date(event.date) < new Date()

  return (
    <main className="min-h-screen bg-void">
      {/* ── TOP BACK LINK ── */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-6xl mx-auto px-6 pt-6 flex items-center justify-between">
          <Link
            href="/events"
            className="pointer-events-auto flex items-center gap-2 font-body text-xs tracking-widest uppercase transition-colors"
            style={{ color: 'rgba(248,248,248,0.5)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#C9A84C')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(248,248,248,0.5)')}
          >
            <ArrowLeft size={14} />
            All Events
          </Link>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-6xl mx-auto px-6 pt-28 pb-24">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">

          {/* LEFT — Portrait image, sticky */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full lg:w-[380px] lg:shrink-0 lg:sticky lg:top-28"
          >
            <div
              className="relative w-full overflow-hidden"
              style={{
                aspectRatio: '3/4',
                background: '#0A0A0A',
                border: '1px solid rgba(201,168,76,0.15)',
              }}
            >
              {event.imageUrl ? (
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  className="object-cover object-top"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p
                    className="font-display font-bold leading-none select-none"
                    style={{
                      fontSize: '8rem',
                      color: 'transparent',
                      WebkitTextStroke: '1px rgba(201,168,76,0.2)',
                    }}
                  >
                    RFY
                  </p>
                </div>
              )}

              {/* Date badge — bottom left of image */}
              <div
                className="absolute bottom-4 left-4 px-3 py-2 text-center"
                style={{
                  background: 'rgba(15,15,15,0.9)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(201,168,76,0.4)',
                }}
              >
                <p className="font-display text-2xl text-gold font-bold leading-none">{dayNum}</p>
                <p className="label-text opacity-70 mt-0.5">{monthShort}</p>
              </div>
            </div>
          </motion.div>

          {/* RIGHT — Event details, scrollable */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 min-w-0"
          >
            {/* City tag */}
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={12} className="text-gold" />
              <p className="label-text">{event.city}</p>
              {isPast && (
                <span
                  className="ml-2 text-[10px] px-2 py-0.5 border font-body tracking-widest"
                  style={{
                    borderColor: 'rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  PAST EVENT
                </span>
              )}
            </div>

            {/* Title */}
            <h1
              className="font-display text-snow font-bold mb-6 leading-tight"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3.2rem)' }}
            >
              {event.title}
            </h1>

            {/* Gold divider */}
            <div className="gold-line-left w-12 mb-8 opacity-50" />

            {/* Details */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4">
                <div
                  className="w-8 h-8 border flex items-center justify-center shrink-0"
                  style={{ borderColor: 'rgba(201,168,76,0.25)' }}
                >
                  <Calendar size={13} className="text-gold" />
                </div>
                <div>
                  <p className="label-text opacity-40 mb-0.5">Date</p>
                  <p className="font-body text-snow text-sm">{dateFormatted}</p>
                </div>
              </div>

              {event.time && (
                <div className="flex items-start gap-4">
                  <div
                    className="w-8 h-8 border flex items-center justify-center shrink-0"
                    style={{ borderColor: 'rgba(201,168,76,0.25)' }}
                  >
                    <Clock size={13} className="text-gold" />
                  </div>
                  <div>
                    <p className="label-text opacity-40 mb-0.5">Time</p>
                    <p className="font-body text-snow text-sm">{event.time}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                <div
                  className="w-8 h-8 border flex items-center justify-center shrink-0"
                  style={{ borderColor: 'rgba(201,168,76,0.25)' }}
                >
                  <MapPin size={13} className="text-gold" />
                </div>
                <div>
                  <p className="label-text opacity-40 mb-0.5">Venue</p>
                  <p className="font-body text-snow text-sm">{event.venue}</p>
                  <p className="font-body text-mist text-xs mt-0.5">{event.city}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <p className="font-body text-mist leading-relaxed text-sm mb-10">
                {event.description}
              </p>
            )}

            {/* CTA */}
            {!isPast && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setRegistrationOpen(true)}
                  className="inline-flex items-center px-7 py-3.5 font-body text-xs font-semibold tracking-widest uppercase transition-all duration-300"
                  style={{ background: '#C9A84C', color: '#0F0F0F' }}
                >
                  Register to Attend →
                </button>
                <Link
                  href="/events"
                  className="inline-flex items-center px-7 py-3.5 font-body text-xs tracking-widest uppercase border transition-all duration-300"
                  style={{
                    borderColor: 'rgba(255,255,255,0.15)',
                    color: 'rgba(248,248,248,0.6)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'
                    e.currentTarget.style.color = '#C9A84C'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                    e.currentTarget.style.color = 'rgba(248,248,248,0.6)'
                  }}
                >
                  View All Events
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── OTHER EVENTS ── */}
      {otherEvents.length > 0 && (
        <section
          className="py-20 px-6"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <p className="label-text mb-2">More Events</p>
                <h2 className="font-display text-snow text-2xl">Coming up</h2>
              </div>
              <Link
                href="/events"
                className="flex items-center gap-2 font-body text-xs tracking-widest uppercase text-gold hover:opacity-70 transition-opacity"
              >
                All Events <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {otherEvents.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Link
                    href={e.slug ? `/events/${e.slug}` : '#'}
                    className="block border group transition-all duration-300 hover-lift"
                    style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                    onMouseEnter={el => (el.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)')}
                    onMouseLeave={el => (el.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                  >
                    {/* Portrait image area */}
                    <div
                      className="relative overflow-hidden"
                      style={{ aspectRatio: '3/4', background: '#1A1A1A' }}
                    >
                      {e.imageUrl ? (
                        <Image
                          src={e.imageUrl}
                          alt={e.title}
                          fill
                          className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span
                            className="font-display text-4xl font-bold"
                            style={{
                              color: 'transparent',
                              WebkitTextStroke: '1px rgba(201,168,76,0.2)',
                            }}
                          >
                            RFY
                          </span>
                        </div>
                      )}
                      {/* Date badge */}
                      <div
                        className="absolute bottom-3 left-3 px-2 py-1.5 text-center z-10"
                        style={{
                          background: 'rgba(15,15,15,0.9)',
                          backdropFilter: 'blur(4px)',
                          border: '1px solid rgba(201,168,76,0.3)',
                        }}
                      >
                        <p className="font-display text-lg text-gold font-bold leading-none">
                          {format(new Date(e.date), 'dd')}
                        </p>
                        <p className="label-text opacity-60 text-[9px]">
                          {format(new Date(e.date), 'MMM').toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="p-4">
                      <p className="label-text opacity-40 mb-1.5">{e.city}</p>
                      <h3 className="font-display text-snow text-base leading-tight group-hover:text-gold transition-colors">
                        {e.title}
                      </h3>
                      {e.time && (
                        <p className="font-body text-mist text-xs mt-1.5">{e.time}</p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Registration modal */}
      <EventRegistrationModal
        isOpen={registrationOpen}
        onClose={() => setRegistrationOpen(false)}
        eventSlug={event.slug ?? event.id}
        eventTitle={event.title}
        eventDate={dateFormatted}
        eventCity={event.city}
        fields={fields}
      />
    </main>
  )
}
```

---

## COMPLETION CHECKLIST

- [ ] Event page is centered within `max-w-6xl` container — not full bleed
- [ ] Portrait image shows in a 3:4 aspect ratio box — full image visible, no cropping
- [ ] Image is sticky on desktop while scrolling details
- [ ] Date badge on bottom-left of image
- [ ] Back link is a fixed overlay at the top left (does not push content)
- [ ] Event title, date, time, venue, description, CTAs all show correctly
- [ ] "Coming up" cards also use 3:4 portrait ratio
- [ ] "Register to Attend" opens modal correctly
- [ ] Mobile: stacked layout, image on top then details below
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The key change: `max-w-6xl mx-auto` wrapper containing everything. The image is `w-[380px]` fixed width on desktop — not a full half-screen column. This gives the poster a natural poster-like size while leaving plenty of room for the details.
- `aspectRatio: '3/4'` on the image container ensures the portrait format is always respected without `object-contain` letterboxing. The full poster fills the container naturally with `object-cover object-top`.
- The sticky behavior uses `lg:sticky lg:top-28` so the poster stays in view as the user scrolls through longer event descriptions.
- Remove the old `<div className="h-20 lg:hidden" />` mobile spacer if it was added in a previous phase — `pt-28` on the main container now handles the navbar clearance.
- The "Coming up" cards also use `aspectRatio: '3/4'` for consistency with the portrait format.
