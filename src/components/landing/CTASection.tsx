import Link from 'next/link'

export function CTASection({ content }: { content: Record<string, string> }) {
  return (
    <section className="relative bg-gradient-to-r from-gold-dark via-gold to-gold-electric py-24">
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="font-display text-display-2xl text-charcoal">
          THE DOOR IS OPEN.
        </h2>
        <p className="mt-6 font-body text-lg text-charcoal/90 md:text-xl">
          {content['landing.cta.subtext'] || 'Step in. There is room for you.'}
        </p>
        <Link
          href="/forms/join-room-for-you"
          className="mt-10 inline-block bg-charcoal px-10 py-4 font-body text-sm font-medium uppercase tracking-widest text-cream transition-colors hover:bg-charcoal-soft"
        >
          {content['landing.cta.button']}
        </Link>
      </div>
    </section>
  )
}
