import type { Metadata } from 'next'
import { OrganizationJsonLd, WebsiteJsonLd } from '@/components/seo/JsonLd'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import './globals.css'

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION

export const metadata: Metadata = {
  metadataBase: new URL('https://rfyglobal.org'),
  title: {
    default: 'Room For You — with Yadah',
    template: '%s — Room For You',
  },
  description:
    'A worship, prayer, study, mentorship and evangelism community founded by Minister Yadah. Jesus to Nations. rfyglobal.org',
  keywords: [
    'Room For You',
    'Yadah',
    'Minister Yadah',
    'worship community',
    'prayer',
    'bible study',
    'gospel community',
    'Nigeria',
    'Jesus to nations',
    'rfyglobal',
    'Christian community',
    'evangelism',
  ],
  authors: [{ name: 'Minister Yadah', url: 'https://yadahworld.com' }],
  creator: 'SonsHub Media',
  publisher: 'Room For You',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: 'https://rfyglobal.org',
    siteName: 'Room For You',
    title: 'Room For You — with Yadah',
    description:
      'Building a community of young men and women who sing songs of salvation, study the Word, and get others saved.',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Room For You — with Yadah',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Room For You — with Yadah',
    description: 'Jesus to Nations. A worship, prayer, study and mentorship community.',
    images: ['/og-default.png'],
    creator: '@yadahworld',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon-16x16.png',
  },
  manifest: '/site.webmanifest',
  ...(googleVerification ? { verification: { google: googleVerification } } : {}),
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
        <OrganizationJsonLd />
        <WebsiteJsonLd />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
