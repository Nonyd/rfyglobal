'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/** Shown on dark backgrounds (e.g. navbar void, footer void). */
const SRC_ON_DARK = '/images/logo-white.png'
/** Shown on light backgrounds. */
const SRC_ON_LIGHT = '/images/logo-dark.png'

export type BrandLogoVariant = 'auto' | 'onDark' | 'onLight'

export type BrandLogoProps = {
  /** `auto` picks by theme; override when background is fixed (e.g. footer charcoal). */
  variant?: BrandLogoVariant
  className?: string
  imgClassName?: string
  width?: number
  height?: number
  priority?: boolean
  href?: string | null
  alt?: string
}

function resolveSrc(variant: BrandLogoVariant, resolvedTheme: string | undefined, mounted: boolean) {
  if (variant === 'onDark') return SRC_ON_DARK
  if (variant === 'onLight') return SRC_ON_LIGHT
  if (!mounted || !resolvedTheme) return SRC_ON_DARK
  return resolvedTheme === 'light' ? SRC_ON_LIGHT : SRC_ON_DARK
}

export function BrandLogo({
  variant = 'auto',
  className,
  imgClassName,
  width = 280,
  height = 93,
  priority = false,
  href = '/',
  alt = 'Room For You — with Yadah',
}: BrandLogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const src = resolveSrc(variant, resolvedTheme, mounted)

  const image = (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={cn(
        'h-auto w-auto max-h-14 object-contain object-left sm:max-h-16 md:max-h-[72px]',
        imgClassName
      )}
      sizes="(max-width: 768px) 200px, 280px"
    />
  )

  if (href === null) {
    return <span className={cn('inline-flex shrink-0 items-center', className)}>{image}</span>
  }

  return (
    <Link href={href} className={cn('inline-flex shrink-0 items-center transition-opacity hover:opacity-90', className)}>
      {image}
    </Link>
  )
}
