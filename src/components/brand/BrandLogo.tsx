'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const SRC_ON_DARK = '/images/brand-logo-on-dark.png'
const SRC_ON_LIGHT = '/images/brand-logo-on-light.png'

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
  width = 160,
  height = 52,
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
      className={cn('h-auto w-auto max-h-[52px] object-contain object-left md:max-h-[56px]', imgClassName)}
      sizes="(max-width: 768px) 140px, 180px"
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
