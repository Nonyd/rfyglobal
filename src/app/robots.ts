import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/', '/_next/'],
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
      {
        userAgent: 'GoogleOther',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
    ],
    sitemap: 'https://rfyglobal.org/sitemap.xml',
    host: 'https://rfyglobal.org',
  }
}
