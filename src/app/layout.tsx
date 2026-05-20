import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildDefaultMetadata } from '@/lib/cms-utils'
import { getCmsSeoDefaults } from '@/lib/cms-metadata'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { CookieBanner } from '@/components/shared/CookieBanner'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getCmsSeoDefaults()
  return buildDefaultMetadata(seo, {
    keywords: [
      'Room For You',
      'Minister Yadah',
      'Yadah',
      'Christian community',
      'gospel community Nigeria',
      'Christian community Abuja',
      'gospel events Abuja',
      'Christian events Nigeria',
      'SonsHub Media',
      'gospel ministry',
      'Room For You with Yadah',
      'Jesus to Nations',
      'Christian worship community',
      'evangelical community Nigeria',
      'Yadah music ministry',
    ],
    authors: [{ name: 'SonsHub Media', url: 'https://rfyglobal.org' }],
    creator: 'SonsHub Media',
    publisher: 'SonsHub Media',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    manifest: '/site.webmanifest',
    alternates: {
      canonical: 'https://rfyglobal.org',
    },
    verification: {
      google: 'GCZiAX-mKgEQGfKwNaSv1AkiZ66lA4KZR6FPOr9RjA4',
    },
    category: 'religion',
  })
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Room For You',
  alternateName: ['Room For You with Yadah', 'RFY'],
  url: 'https://rfyglobal.org',
  logo: 'https://rfyglobal.org/images/logo-dark.png',
  sameAs: [
    'https://instagram.com/rfyglobal',
    'https://youtube.com/@yadah',
    'https://x.com/rfyglobal',
  ],
  description:
    'Room For You is a global Christian community movement founded by Minister Yadah and SonsHub Media. Monthly gatherings. Daily scripture. Prayer support.',
  founder: {
    '@type': 'Person',
    name: 'Minister Yadah',
    alternateName: 'Yadah',
    jobTitle: 'Gospel Minister & Founder',
    url: 'https://yadahworld.com',
  },
  parentOrganization: {
    '@type': 'Organization',
    name: 'SonsHub Media',
    url: 'https://sonshubmedia.com',
  },
  areaServed: {
    '@type': 'AdministrativeArea',
    name: 'Global',
  },
  knowsAbout: [
    'Christian community',
    'Gospel music',
    'Bible study',
    'Evangelical outreach',
    'Prayer ministry',
  ],
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Room For You',
  url: 'https://rfyglobal.org',
  description: 'A global Christian community with Minister Yadah',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://rfyglobal.org/blog?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=general-sans@300,400,500,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <JsonLd data={[organizationSchema, websiteSchema]} />
        <ThemeProvider>
          {children}
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  )
}
