import { cn } from '@/lib/utils'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'

export function PublicPageShell({
  children,
  className,
  mainClassName,
  hideFooter,
}: {
  children: React.ReactNode
  /** Extra classes on outer wrapper (rarely needed) */
  className?: string
  /** Classes on `<main>` */
  mainClassName?: string
  /** Immersive pages (e.g. confession) */
  hideFooter?: boolean
}) {
  return (
    <div className={cn('min-h-screen bg-bg', className)}>
      <Navbar />
      <main className={cn('min-h-screen', mainClassName)}>{children}</main>
      {!hideFooter ? <Footer /> : null}
    </div>
  )
}

export function PublicPageHeader({
  eyebrow,
  title,
  subtitle,
  centered = true,
  className,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  centered?: boolean
  className?: string
}) {
  return (
    <header
      className={cn(
        'mx-auto max-w-7xl px-6 pb-12 pt-28 md:pt-32',
        centered && 'text-center',
        className,
      )}
    >
      {eyebrow ? (
        <p className="mb-4 font-body text-[10px] uppercase tracking-[0.35em] text-crimson">{eyebrow}</p>
      ) : null}
      <h1 className="font-display text-4xl leading-tight text-text-primary lg:text-6xl">{title}</h1>
      {subtitle ? (
        <p className="mx-auto mt-4 max-w-2xl font-body text-lg text-text-secondary">{subtitle}</p>
      ) : null}
      <div
        className={cn(
          'mt-6 h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent',
          centered ? 'mx-auto max-w-xs' : 'max-w-xs',
        )}
      />
    </header>
  )
}
