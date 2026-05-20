import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/seo'

/** Split CMS textarea (one item per line) with fallback list. Safe for client components. */
export function cmsLines(value: string | undefined, fallback: string[]): string[] {
  const trimmed = value?.trim()
  if (!trimmed) return fallback
  const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean)
  return lines.length > 0 ? lines : fallback
}

export function pageHeaderFromContent(
  content: Record<string, string>,
  prefix: string,
  fallbacks?: { eyebrow?: string; title?: string; subtitle?: string },
) {
  return {
    eyebrow: content[`pages.${prefix}.eyebrow`] || fallbacks?.eyebrow || 'Room For You',
    title: content[`pages.${prefix}.title`] || fallbacks?.title || '',
    subtitle: content[`pages.${prefix}.subtitle`] || fallbacks?.subtitle,
  }
}

export function buildDefaultMetadata(
  seo: { title: string; description: string; ogImage: string },
  overrides?: Partial<Metadata>,
): Metadata {
  const base: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
      default: seo.title,
      template: '%s | Room For You',
    },
    description: seo.description,
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: SITE_URL,
      siteName: 'Room For You',
      title: seo.title,
      description: seo.description,
      images: [
        {
          url: seo.ogImage,
          width: 1200,
          height: 630,
          alt: seo.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: [seo.ogImage],
      creator: '@rfyglobal',
      site: '@rfyglobal',
    },
  }
  if (!overrides) return base
  return {
    ...base,
    ...overrides,
    openGraph: { ...base.openGraph, ...overrides.openGraph },
    twitter: { ...base.twitter, ...overrides.twitter },
  }
}

export const CMS_SEO_FALLBACKS = {
  title: 'Room For You — A Christian Community with Minister Yadah',
  description:
    'Room For You is a global Christian community founded by Minister Yadah. Monthly gatherings. Daily Word. Prayer. Join us — there is room for you here.',
  ogImage: DEFAULT_OG_IMAGE,
} as const
