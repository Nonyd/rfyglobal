'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'

export interface PublicEvent {
  id: string
  slug: string | null
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
              className="px-5 py-2 font-body text-sm tracking-wide transition-all duration-200 border"
              style={{
                background: activeCity === city ? '#C9A84C' : 'transparent',
                color: activeCity === city ? '#0F0F0F' : 'rgb(var(--color-text-secondary))',
                borderColor: activeCity === city ? 'transparent' : 'rgb(var(--color-border))',
              }}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((event, index) => (
            <Link
              key={event.id}
              href={event.slug ? `/events/${event.slug}` : '#'}
              prefetch={Boolean(event.slug)}
              className="rfy-card group block overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-elevated cursor-pointer border"
              style={{
                borderColor: 'rgb(var(--color-border))',
                background: 'rgb(var(--color-bg))',
              }}
            >
              <div
                className="relative overflow-hidden w-full"
                style={{ aspectRatio: '3/4', background: 'rgb(var(--color-surface))' }}
              >
                {event.imageUrl ? (
                  <Image
                    src={event.imageUrl}
                    alt={event.title}
                    fill
                    priority={index === 0}
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span
                      className="font-display font-bold select-none"
                      style={{
                        fontSize: '5rem',
                        color: 'transparent',
                        WebkitTextStroke: '1px rgba(201,168,76,0.15)',
                      }}
                    >
                      RFY
                    </span>
                  </div>
                )}
                <div
                  className="absolute bottom-3 left-3 px-2.5 py-2 text-center z-10"
                  style={{
                    background: 'rgba(15,15,15,0.92)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(201,168,76,0.35)',
                  }}
                >
                  <p className="font-display text-xl text-gold font-bold leading-none">
                    {format(new Date(event.date), 'dd')}
                  </p>
                  <p className="label-text opacity-60 text-[9px] mt-0.5">
                    {format(new Date(event.date), 'MMM').toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="p-4">
                <p
                  className="label-text opacity-40 mb-1.5"
                  style={{ color: 'rgb(var(--color-text-muted))' }}
                >
                  {event.city}
                </p>
                <h3
                  className="font-display text-lg leading-tight group-hover:text-gold transition-colors mb-2"
                  style={{ color: 'rgb(var(--color-text-primary))' }}
                >
                  {event.title}
                </h3>
                {event.time && (
                  <p
                    className="font-body text-xs mb-2"
                    style={{ color: 'rgb(var(--color-text-secondary))' }}
                  >
                    {event.time}
                  </p>
                )}
                {event.description && (
                  <p
                    className="font-body text-xs leading-relaxed line-clamp-2"
                    style={{ color: 'rgb(var(--color-text-secondary))' }}
                  >
                    {event.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
