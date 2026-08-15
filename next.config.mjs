/** @type {import('next').NextConfig} */

const nextConfig = {
  // WooCommerce canonicalizes checkout with a trailing slash while the
  // Next.js proxy route accepts both forms. Let the route handle that
  // canonicalization instead of creating a redirect loop.
  skipTrailingSlashRedirect: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Optimization is ON: WordPress images arrive through the same-origin
    // proxy and are resized and served as AVIF/WebP instead of raw originals.
    formats: ['image/avif', 'image/webp'],
    // Next.js 16 rejects any quality that is not declared here.
    qualities: [70, 75, 80, 82],
    // HTTP image URLs are served through the same-origin proxy. Allow only
    // this route (with its encoded query string), never arbitrary local paths.
    localPatterns: [
      {
        pathname: '/api/img',
      },
    ],
    minimumCacheTTL: 604800,
  },
  async redirects() {
    return [
      // /import was the vehicle page until the section was split into "for
      // sale" and "import" under /cars. Preserve indexed and shared URLs.
      { source: '/import', destination: '/cars', permanent: true },
      {
        source: '/import/:slug',
        destination: '/cars/import/:slug',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
