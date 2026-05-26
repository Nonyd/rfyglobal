/** @type {import('next').NextConfig} */

const CSP = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline'
    https://js.paystack.co
    https://checkout.flutterwave.com
    https://static.cloudflareinsights.com
    https://editor.unlayer.com
    https://unlayer.com;
  style-src 'self' 'unsafe-inline'
    https://fonts.googleapis.com
    https://api.fontshare.com
    https://editor.unlayer.com;
  font-src 'self'
    https://fonts.gstatic.com
    https://api.fontshare.com
    https://editor.unlayer.com;
  img-src 'self' data: blob: https:;
  media-src 'self' https://res.cloudinary.com blob:;
  frame-src 'self'
    https://www.youtube.com
    https://www.youtube-nocookie.com
    https://player.vimeo.com
    https://checkout.paystack.com
    https://checkout.flutterwave.com
    https://checkout.payaza.africa
    https://editor.unlayer.com
    https://unlayer.com;
  connect-src 'self'
    https://rfyglobal.org
    https://api.cloudinary.com
    https://api.paystack.co
    https://api.flutterwave.com
    https://api.payaza.africa
    https://fonts.gstatic.com
    https://api.fontshare.com
    https://static.cloudflareinsights.com
    https://editor.unlayer.com
    https://unlayer.com
    https://api.unlayer.com;
  worker-src 'self' blob:;
`.replace(/\s{2,}/g, ' ').trim()

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: CSP,
  },
]

const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    /** Allow CMS uploads that are SVGs on Cloudinary; without this, next/image rejects many remote SVGs. */
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  compress: true,

  productionBrowserSourceMaps: false,

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@resvg/resvg-js')
    }
    return config
  },
}

export default nextConfig
