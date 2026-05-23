'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Clock, Calendar, ArrowLeft, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import type { Event, EventFormField } from '@prisma/client'
import { EventRegistrationModal } from '@/components/events/EventRegistrationModal'

interface SingleEventClientProps {
  event: Event
  otherEvents: Event[]
  fields: EventFormField[]
  paystackEnabled: boolean
}

export function SingleEventClient({ event, otherEvents, fields, paystackEnabled }: SingleEventClientProps) {
  const [registrationOpen, setRegistrationOpen] = useState(false)

  const dateFormatted = format(new Date(event.date), 'EEEE, MMMM do yyyy')
  const monthShort = format(new Date(event.date), 'MMM').toUpperCase()
  const dayNum = format(new Date(event.date), 'dd')
  const isPast = new Date(event.date) < new Date()

  return (
    <main className="min-h-screen bg-void">
      {/* Top back link — below fixed Navbar (z-40), does not push main flow */}
      <div className="pointer-events-none fixed left-0 right-0 top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-24 lg:pt-28">
          <Link
            href="/events"
            className="pointer-events-auto flex items-center gap-2 font-body text-xs uppercase tracking-widest transition-colors"
            style={{ color: 'rgba(248,248,248,0.5)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#8B0000'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(248,248,248,0.5)'
            }}
          >
            <ArrowLeft size={14} />
            All Events
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-24 pt-28 lg:pt-32">
        <div className="flex flex-col items-start gap-10 lg:flex-row lg:gap-16">
          {/* LEFT — Portrait image, sticky */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full shrink-0 lg:sticky lg:top-28 lg:w-[380px]"
          >
            <div
              className="relative w-full overflow-hidden"
              style={{
                aspectRatio: '3/4',
                background: '#0A0A0A',
                border: '1px solid rgba(139,0,0,0.15)',
              }}
            >
              {event.imageUrl ? (
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  className="object-cover object-top"
                  priority
                  sizes="(max-width: 1024px) 100vw, 380px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p
                    className="select-none font-display font-bold leading-none"
                    style={{
                      fontSize: '8rem',
                      color: 'transparent',
                      WebkitTextStroke: '1px rgba(139,0,0,0.2)',
                    }}
                  >
                    RFY
                  </p>
                </div>
              )}

              <div
                className="absolute bottom-4 left-4 px-3 py-2 text-center"
                style={{
                  background: 'rgba(15,15,15,0.9)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(139,0,0,0.4)',
                }}
              >
                <p className="font-display text-2xl font-bold leading-none text-crimson">{dayNum}</p>
                <p className="label-text mt-0.5 opacity-70">{monthShort}</p>
              </div>
            </div>
          </motion.div>

          {/* RIGHT — Event details */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="min-w-0 flex-1"
          >
            <div className="mb-4 flex items-center gap-2">
              <MapPin size={12} className="text-crimson" />
              <p className="label-text">{event.city}</p>
              {isPast && (
                <span
                  className="ml-2 border px-2 py-0.5 font-body text-[10px] tracking-widest"
                  style={{
                    borderColor: 'rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  PAST EVENT
                </span>
              )}
            </div>

            <h1
              className="mb-6 font-display font-bold leading-tight text-snow"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3.2rem)' }}
            >
              {event.title}
            </h1>

            <div className="gold-line-left mb-8 w-12 opacity-50" />

            <div className="mb-8 space-y-4">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center border"
                  style={{ borderColor: 'rgba(139,0,0,0.25)' }}
                >
                  <Calendar size={13} className="text-crimson" />
                </div>
                <div>
                  <p className="label-text mb-0.5 opacity-40">Date</p>
                  <p className="font-body text-sm text-snow">{dateFormatted}</p>
                </div>
              </div>

              {event.time && (
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center border"
                    style={{ borderColor: 'rgba(139,0,0,0.25)' }}
                  >
                    <Clock size={13} className="text-crimson" />
                  </div>
                  <div>
                    <p className="label-text mb-0.5 opacity-40">Time</p>
                    <p className="font-body text-sm text-snow">{event.time}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center border"
                  style={{ borderColor: 'rgba(139,0,0,0.25)' }}
                >
                  <MapPin size={13} className="text-crimson" />
                </div>
                <div>
                  <p className="label-text mb-0.5 opacity-40">Venue</p>
                  <p className="font-body text-sm text-snow">{event.venue}</p>
                  <p className="mt-0.5 font-body text-xs text-mist">{event.city}</p>
                </div>
              </div>
            </div>

            {event.description && (
              <p className="mb-10 font-body text-sm leading-relaxed text-mist">{event.description}</p>
            )}

            {!isPast && (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setRegistrationOpen(true)}
                  className="inline-flex items-center px-7 py-3.5 font-body text-xs font-semibold uppercase tracking-widest transition-all duration-300"
                  style={{ background: '#8B0000', color: '#0F0F0F' }}
                >
                  Register to Attend →
                </button>
                <Link
                  href="/events"
                  className="inline-flex items-center border px-7 py-3.5 font-body text-xs uppercase tracking-widest transition-all duration-300"
                  style={{
                    borderColor: 'rgba(255,255,255,0.15)',
                    color: 'rgba(248,248,248,0.6)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(139,0,0,0.4)'
                    e.currentTarget.style.color = '#8B0000'
                  }}
                  onMouseLeave={(e) => {
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

      {otherEvents.length > 0 && (
        <section className="px-6 py-20" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <p className="label-text mb-2">More Events</p>
                <h2 className="font-display text-2xl text-snow">Coming up</h2>
              </div>
              <Link
                href="/events"
                className="flex items-center gap-2 font-body text-xs uppercase tracking-widest text-crimson transition-opacity hover:opacity-70"
              >
                All Events <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
                    className="hover-lift group block border transition-all duration-300"
                    style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                    onMouseEnter={(el) => {
                      el.currentTarget.style.borderColor = 'rgba(139,0,0,0.3)'
                    }}
                    onMouseLeave={(el) => {
                      el.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                    }}
                  >
                    <div
                      className="relative overflow-hidden"
                      style={{ aspectRatio: '3/4', background: '#1A1A1A' }}
                    >
                      {e.imageUrl ? (
                        <Image
                          src={e.imageUrl}
                          alt={e.title}
                          fill
                          className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span
                            className="font-display text-4xl font-bold"
                            style={{
                              color: 'transparent',
                              WebkitTextStroke: '1px rgba(139,0,0,0.2)',
                            }}
                          >
                            RFY
                          </span>
                        </div>
                      )}
                      <div
                        className="absolute bottom-3 left-3 z-10 px-2 py-1.5 text-center"
                        style={{
                          background: 'rgba(15,15,15,0.9)',
                          backdropFilter: 'blur(4px)',
                          border: '1px solid rgba(139,0,0,0.3)',
                        }}
                      >
                        <p className="font-display text-lg font-bold leading-none text-crimson">
                          {format(new Date(e.date), 'dd')}
                        </p>
                        <p className="label-text text-[9px] opacity-60">
                          {format(new Date(e.date), 'MMM').toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="p-4">
                      <p className="label-text mb-1.5 opacity-40">{e.city}</p>
                      <h3 className="font-display text-base leading-tight text-snow transition-colors group-hover:text-crimson">
                        {e.title}
                      </h3>
                      {e.time && <p className="mt-1.5 font-body text-xs text-mist">{e.time}</p>}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <EventRegistrationModal
        isOpen={registrationOpen}
        onClose={() => setRegistrationOpen(false)}
        eventId={event.id}
        eventSlug={event.slug ?? event.id}
        eventTitle={event.title}
        eventDate={dateFormatted}
        eventCity={event.city}
        fields={fields}
        registrationFeeNgn={event.registrationFeeNgn}
        registrationFeeUsd={event.registrationFeeUsd}
        paystackEnabled={paystackEnabled}
      />
    </main>
  )
}
