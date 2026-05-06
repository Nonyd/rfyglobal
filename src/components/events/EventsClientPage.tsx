'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PublicEvent {
  id: string
  slug: string
  title: string
  description?: string | null
  city: string
  venue: string
  date: Date | string
  time?: string | null
  imageUrl?: string | null
}

interface EventsClientPageProps {
  events: PublicEvent[]
  cities: string[]
}

export function EventsClientPage({ events, cities }: EventsClientPageProps) {
  const [activeCity, setActiveCity] = useState('All')

  const filtered =
    activeCity === 'All' ? events : events.filter((e) => e.city === activeCity)

  return (
    <div className="mx-auto max-w-7xl px-6">
      {cities.length > 1 && (
        <div className="mb-12 flex flex-wrap justify-center gap-2">
          {['All', ...cities].map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setActiveCity(city)}
              className={cn(
                'px-5 py-2 font-body text-sm tracking-wide transition-all duration-200',
                activeCity === city
                  ? 'bg-gold text-charcoal shadow-soft'
                  : 'border border-theme text-text-secondary hover:border-gold/50 hover:text-text-primary'
              )}
            >
              {city}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-display text-2xl italic text-text-muted">
            No upcoming events in {activeCity} yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event, index) => (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="rfy-card group block overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-elevated cursor-pointer"
            >
              <div className="relative h-48 overflow-hidden bg-charcoal-soft">
                {event.imageUrl ? (
                  <Image
                    src={event.imageUrl}
                    alt={event.title}
                    fill
                    priority={index === 0}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="font-display text-4xl italic text-gold/20">RFY</span>
                  </div>
                )}
                <div className="absolute left-4 top-4 border border-gold/40 bg-charcoal/90 px-3 py-2 text-center backdrop-blur-sm">
                  <p className="font-display text-2xl leading-none text-gold">
                    {format(new Date(event.date), 'dd')}
                  </p>
                  <p className="font-body text-[10px] uppercase tracking-widest text-gold/70">
                    {format(new Date(event.date), 'MMM')}
                  </p>
                </div>
              </div>

              <div className="p-6">
                <h3 className="mb-2 font-display text-xl text-text-primary transition-colors group-hover:text-gold">
                  {event.title}
                </h3>
                <div className="mb-3 flex items-center gap-1 font-body text-xs text-text-muted">
                  <MapPin size={12} />
                  <span>
                    {event.venue}, {event.city}
                  </span>
                </div>
                {event.time && (
                  <p className="mb-3 font-body text-xs text-gold/60">{event.time}</p>
                )}
                {event.description && (
                  <p className="line-clamp-2 font-body text-sm text-text-secondary">{event.description}</p>
                )}
                <div className="mt-4 flex justify-end">
                  <span className="font-body text-sm text-gold/40 transition-colors group-hover:text-gold">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
