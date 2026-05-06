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
  formFields: EventFormField[]
}

export function SingleEventClient({ event, otherEvents, formFields }: SingleEventClientProps) {
  const [registrationOpen, setRegistrationOpen] = useState(false)
  const dateFormatted = format(new Date(event.date), 'EEEE, MMMM do yyyy')
  const monthShort = format(new Date(event.date), 'MMM').toUpperCase()
  const dayNum = format(new Date(event.date), 'dd')
  const isPast = new Date(event.date) < new Date()

  return (
    <main className="min-h-screen bg-void">
      {/* Offset below fixed Navbar on all breakpoints (was mobile-only spacer). */}
      <section className="grid grid-cols-1 lg:grid-cols-2 pt-24 lg:pt-32">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative min-h-[60vh] lg:min-h-[calc(100vh-8rem)] lg:sticky lg:top-28 lg:self-start"
        >
          {event.imageUrl ? (
            <>
              <Image
                src={event.imageUrl}
                alt={event.title}
                fill
                className="object-cover"
                priority
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to right, rgba(15,15,15,0.3), rgba(15,15,15,0.1))',
                }}
              />
            </>
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #0F0F0F 100%)' }}
            >
              <div className="text-center">
                <p
                  className="font-display text-[8rem] font-bold leading-none"
                  style={{
                    color: 'transparent',
                    WebkitTextStroke: '1px rgba(201,168,76,0.3)',
                  }}
                >
                  RFY
                </p>
                <div className="gold-line w-24 mx-auto mt-4 opacity-30" />
              </div>
            </div>
          )}

          <div className="absolute top-8 left-8 lg:top-10 lg:left-12 z-10">
            <div className="border border-gold/40 bg-void/80 backdrop-blur-sm px-4 py-3 text-center">
              <p className="font-display text-4xl text-gold font-bold leading-none">{dayNum}</p>
              <p className="label-text opacity-70 mt-1">{monthShort}</p>
            </div>
          </div>

          <Link
            href="/events"
            className="absolute bottom-8 left-8 lg:bottom-12 lg:left-12 z-10 flex items-center gap-2 font-body text-xs tracking-widest uppercase transition-colors"
            style={{ color: 'rgba(248,248,248,0.5)' }}
          >
            <ArrowLeft size={14} />
            All Events
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col justify-center px-8 lg:px-16 xl:px-20 pt-12 pb-16 lg:pt-16 lg:pb-32"
          style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center gap-2 mb-6"
          >
            <MapPin size={12} className="text-gold" />
            <p className="label-text">{event.city}</p>
            {isPast && (
              <span
                className="ml-2 text-[10px] px-2 py-0.5 border font-body tracking-widest"
                style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }}
              >
                PAST EVENT
              </span>
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-snow font-bold mb-8"
            style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: '1.05' }}
          >
            {event.title}
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="gold-line-left w-16 mb-10 origin-left"
          />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="space-y-5 mb-10"
          >
            <div className="flex items-start gap-4">
              <div
                className="w-8 h-8 border flex items-center justify-center shrink-0"
                style={{ borderColor: 'rgba(201,168,76,0.3)' }}
              >
                <Calendar size={14} className="text-gold" />
              </div>
              <div>
                <p className="label-text mb-1 opacity-50">Date</p>
                <p className="font-body text-snow">{dateFormatted}</p>
              </div>
            </div>

            {event.time && (
              <div className="flex items-start gap-4">
                <div
                  className="w-8 h-8 border flex items-center justify-center shrink-0"
                  style={{ borderColor: 'rgba(201,168,76,0.3)' }}
                >
                  <Clock size={14} className="text-gold" />
                </div>
                <div>
                  <p className="label-text mb-1 opacity-50">Time</p>
                  <p className="font-body text-snow">{event.time}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-4">
              <div
                className="w-8 h-8 border flex items-center justify-center shrink-0"
                style={{ borderColor: 'rgba(201,168,76,0.3)' }}
              >
                <MapPin size={14} className="text-gold" />
              </div>
              <div>
                <p className="label-text mb-1 opacity-50">Venue</p>
                <p className="font-body text-snow">{event.venue}</p>
                <p className="font-body text-mist text-sm">{event.city}</p>
              </div>
            </div>
          </motion.div>

          {event.description && (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.9 }}
              className="font-body text-mist leading-relaxed mb-12"
            >
              {event.description}
            </motion.p>
          )}

          {!isPast && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1 }}
              className="flex flex-wrap gap-4"
            >
              <button
                type="button"
                onClick={() => setRegistrationOpen(true)}
                className="inline-flex items-center gap-2 px-8 py-4 font-body text-xs font-semibold tracking-widest uppercase transition-all duration-300"
                style={{ background: '#C9A84C', color: '#0F0F0F' }}
              >
                Register to Attend →
              </button>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-8 py-4 font-body text-xs tracking-widest uppercase border transition-all duration-300"
                style={{
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: 'rgba(248,248,248,0.6)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'
                  e.currentTarget.style.color = '#C9A84C'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                  e.currentTarget.style.color = 'rgba(248,248,248,0.6)'
                }}
              >
                View All Events
              </Link>
            </motion.div>
          )}
        </motion.div>
      </section>

      {otherEvents.length > 0 && (
        <section className="py-24 px-6 lg:px-16" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <p className="label-text mb-2">More Events</p>
                <h2 className="font-display text-snow text-3xl">Coming up</h2>
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
                    onMouseEnter={(el) => (el.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)')}
                    onMouseLeave={(el) => (el.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                  >
                    <div className="h-40 relative overflow-hidden" style={{ background: '#1A1A1A' }}>
                      {e.imageUrl ? (
                        <Image
                          src={e.imageUrl}
                          alt={e.title}
                          fill
                          className="object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span
                            className="font-display text-3xl font-bold"
                            style={{
                              color: 'transparent',
                              WebkitTextStroke: '1px rgba(201,168,76,0.2)',
                            }}
                          >
                            RFY
                          </span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-void/90 border border-gold/30 px-2 py-1.5 text-center">
                        <p className="font-display text-xl text-gold font-bold leading-none">
                          {format(new Date(e.date), 'dd')}
                        </p>
                        <p className="label-text opacity-60 text-[9px]">
                          {format(new Date(e.date), 'MMM').toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="p-5">
                      <p className="label-text opacity-50 mb-2">{e.city}</p>
                      <h3 className="font-display text-snow text-lg leading-tight group-hover:text-gold transition-colors">
                        {e.title}
                      </h3>
                      {e.time && (
                        <p className="font-body text-mist text-xs mt-2">{e.time}</p>
                      )}
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
        eventSlug={event.slug ?? event.id}
        eventTitle={event.title}
        eventDate={dateFormatted}
        eventCity={event.city}
        customFields={formFields}
      />
    </main>
  )
}
