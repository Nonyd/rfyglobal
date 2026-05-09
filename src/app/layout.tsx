import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { CookieBanner } from '@/components/shared/CookieBanner'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://rfyglobal.org'),
  title: {
    default: 'Room For You — A Christian Community with Minister Yadah',
    template: '%s | Room For You',
  },
  description:
    'Room For You is a global Christian community founded by Minister Yadah. We gather monthly across cities for worship, prayer, and Bible study. Join us — there is room for you here.',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://rfyglobal.org',
    siteName: 'Room For You',
    title: 'Room For You — A Christian Community with Minister Yadah',
    description:
      'A global community of young men and women singing songs of salvation, studying the Word, praying, and getting others saved. Founded by Minister Yadah.',
    images: [
      {
        url: '/og?title=Room+For+You&subtitle=A+Christian+Community+with+Minister+Yadah',
        width: 1200,
        height: 630,
        alt: 'Room For You — A Christian Community with Minister Yadah',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Room For You — A Christian Community with Minister Yadah',
    description:
      'A global Christian community founded by Minister Yadah. Monthly gatherings. Daily Word. Prayer. Join us.',
    images: ['/og?title=Room+For+You&subtitle=A+Christian+Community+with+Minister+Yadah'],
    creator: '@rfyglobal',
    site: '@rfyglobal',
  },
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
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: 'https://rfyglobal.org',
  },
  verification: {
    google: 'GCZiAX-mKgEQGfKwNaSv1AkiZ66lA4KZR6FPOr9RjA4',
  },
  category: 'religion',
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
