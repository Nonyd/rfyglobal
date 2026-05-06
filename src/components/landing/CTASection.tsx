import Link from 'next/link'

export function CTASection({ content }: { content: Record<string, string> }) {
  return (
    <section className="relative bg-black py-24">
      <div className="mx-auto h-px max-w-5xl bg-gradient-to-r from-transparent via-gold to-transparent" />
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="font-display text-display-xl italic text-gradient-gold">
          {content['landing.cta.headline']}
        </h2>
        <p className="mt-6 font-body text-lg text-white/80 md:text-xl">{content['landing.cta.subtext']}</p>
        <Link
          href="/forms/join-room-for-you"
          className="mt-10 inline-block bg-gold px-10 py-4 font-body text-sm font-medium uppercase tracking-widest text-black transition-colors hover:bg-gold-light"
        >
          {content['landing.cta.button']}
        </Link>
      </div>      <div className="mx-auto h-px max-w-5xl bg-gradient-to-r from-transparent via-gold to-transparent" />
    </section>
  )
}
