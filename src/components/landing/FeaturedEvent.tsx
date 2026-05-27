'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { format } from 'date-fns'
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react'
import type { EventFormField } from '@prisma/client'
import { EventRegistrationModal } from '@/components/events/EventRegistrationModal'
import { isEventStillActive } from '@/lib/event-utils'
import {
  normalizeUploadSrc,
  shouldBypassImageOptimization,
} from '@/lib/image-display'

export interface FeaturedEventData {
  id: string
  title: string
  description?: string | null
  date: Date
  time?: string | null
  city: string
  venue: string
  imageUrl?: string | null
  slug?: string | null
  registrationFeeNgn?: number | null
  registrationFeeUsd?: number | null
}

interface Props {
  event: FeaturedEventData
  fields: EventFormField[]
  paystackEnabled?: boolean
}

function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

function formatEventTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date))
}

function getDaysUntil(date: Date): number {
  const now = new Date()
  const diff = new Date(date).getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function getPriceLabel(event: FeaturedEventData): string {
  const ngn = event.registrationFeeNgn ?? 0
  const usd = event.registrationFeeUsd ?? 0
  if (ngn <= 0 && usd <= 0) return 'Free Entry'
  if (ngn > 0 && usd > 0) return `₦${ngn.toLocaleString()} / $${usd.toLocaleString()}`
  if (ngn > 0) return `₦${ngn.toLocaleString()}`
  if (usd > 0) return `$${usd.toLocaleString()}`
  return 'Register'
}

export function FeaturedEvent({ event, fields, paystackEnabled = false }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [registrationOpen, setRegistrationOpen] = useState(false)

  const daysUntil = getDaysUntil(event.date)
  const eventUrl = event.slug ? `/events/${event.slug}` : `/events/${event.id}`
  const eventSlug = event.slug ?? event.id
  const location = [event.venue, event.city].filter(Boolean).join(', ')
  const canRegister = isEventStillActive(event.date)
  const dateFormatted = format(new Date(event.date), 'EEEE, MMMM do yyyy')

  const urgencyLabel =
    daysUntil === 0
      ? 'Today'
      : daysUntil === 1
        ? 'Tomorrow'
        : daysUntil <= 7
          ? `In ${daysUntil} days`
          : null

  return (
    <section
      style={{
        background: 'var(--color-bg)',
        padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 5rem)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ marginBottom: '3rem' }}
      >
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.7rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'var(--color-accent)',
            margin: '0 0 0.5rem',
          }}
        >
          Upcoming Event
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          Don&apos;t Miss{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--color-accent)' }}>What&apos;s Next</em>
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.32, 0.72, 0, 1] }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'clamp(2rem, 5vw, 4rem)',
          alignItems: 'center',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'relative',
            aspectRatio: '3/4',
            background: 'var(--color-surface)',
            overflow: 'hidden',
            minHeight: '320px',
          }}
        >
          {event.imageUrl ? (
            <Image
              src={normalizeUploadSrc(event.imageUrl)}
              alt={event.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: 'cover' }}
              priority
              unoptimized={shouldBypassImageOptimization(event.imageUrl)}
            />
          ) : (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--color-surface)',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '4rem',
                    opacity: 0.1,
                    margin: 0,
                  }}
                >
                  ✦
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.8rem',
                    color: 'var(--color-text-muted)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  Event Flyer
                </p>
              </div>
            </div>
          )}

          {urgencyLabel && (
            <div
              style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                background: 'var(--color-accent)',
                color: 'var(--color-bg)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '0.35rem 0.85rem',
              }}
            >
              {urgencyLabel}
            </div>
          )}
        </div>

        <div
          style={{
            padding: 'clamp(1.5rem, 4vw, 3rem)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          <div>
            <span
              style={{
                display: 'inline-block',
                fontFamily: 'var(--font-body)',
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--color-accent)',
                border: '1px solid var(--color-accent)',
                padding: '0.25rem 0.75rem',
              }}
            >
              {getPriceLabel(event)}
            </span>
          </div>

          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.75rem, 4vw, 3rem)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            {event.title}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Calendar size={15} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {formatEventDate(event.date)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Clock size={15} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {event.time?.trim() || formatEventTime(event.date)}
              </span>
            </div>

            {location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <MapPin size={15} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.9rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {location}
                </span>
              </div>
            )}
          </div>

          {event.description && (
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.95rem',
                lineHeight: 1.75,
                color: 'var(--color-text-secondary)',
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {event.description}
            </p>
          )}

          <div
            style={{
              height: '1px',
              background: 'var(--color-border)',
            }}
          />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            {canRegister ? (
              <button
                type="button"
                onClick={() => setRegistrationOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 2rem',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  background: 'var(--color-accent)',
                  color: 'var(--color-bg)',
                  border: '2px solid var(--color-accent)',
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  el.style.background = 'transparent'
                  el.style.color = 'var(--color-accent)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.background = 'var(--color-accent)'
                  el.style.color = 'var(--color-bg)'
                }}
              >
                Register Now <ArrowRight size={14} />
              </button>
            ) : (
              <Link
                href={eventUrl}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 2rem',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  background: 'var(--color-accent)',
                  color: 'var(--color-bg)',
                  textDecoration: 'none',
                  border: '2px solid var(--color-accent)',
                  transition: 'all 0.25s',
                }}
              >
                View event <ArrowRight size={14} />
              </Link>
            )}

            <Link
              href={eventUrl}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: '2px',
                transition: 'color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget
                el.style.color = 'var(--color-accent)'
                el.style.borderColor = 'var(--color-accent)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                el.style.color = 'var(--color-text-secondary)'
                el.style.borderColor = 'var(--color-border)'
              }}
            >
              View event details
            </Link>
          </div>
        </div>
      </motion.div>

      <EventRegistrationModal
        isOpen={registrationOpen}
        onClose={() => setRegistrationOpen(false)}
        eventId={event.id}
        eventSlug={eventSlug}
        eventTitle={event.title}
        eventDate={dateFormatted}
        eventCity={event.city}
        fields={fields}
        registrationFeeNgn={event.registrationFeeNgn}
        registrationFeeUsd={event.registrationFeeUsd}
        paystackEnabled={paystackEnabled}
      />
    </section>
  )
}
