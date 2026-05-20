import 'server-only'

import type { Metadata } from 'next'
import { getContentMany } from '@/lib/content'
import { CMS_SEO_FALLBACKS } from '@/lib/cms-utils'
import { SITE_URL } from '@/lib/seo'

const SEO_KEYS = ['seo.defaultTitle', 'seo.defaultDescription', 'seo.ogImage'] as const

export { buildDefaultMetadata, cmsLines, pageHeaderFromContent } from '@/lib/cms-utils'

export async function getCmsSeoDefaults() {
  const seo = await getContentMany([...SEO_KEYS])
  const title = seo['seo.defaultTitle']?.trim() || CMS_SEO_FALLBACKS.title
  const description = seo['seo.defaultDescription']?.trim() || CMS_SEO_FALLBACKS.description
  const ogImage = seo['seo.ogImage']?.trim() || CMS_SEO_FALLBACKS.ogImage
  return { title, description, ogImage }
}

export async function getPageMetadata(
  pageTitle: string,
  pageDescription: string,
  canonicalPath: string,
): Promise<Metadata> {
  const seo = await getCmsSeoDefaults()
  const title = pageTitle.includes('|') ? pageTitle : `${pageTitle} | Room For You`
  const url = `${SITE_URL}${canonicalPath}`
  return {
    title: pageTitle,
    description: pageDescription,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: pageDescription,
      url,
      images: [
        {
          url: seo.ogImage,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: pageDescription,
      images: [seo.ogImage],
    },
  }
}
