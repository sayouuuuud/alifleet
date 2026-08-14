/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Optimization is ON: the PNGs in /public are 0.5–2 MB each and WordPress
    // images arrive through the same-origin /api/img proxy, so both are now
    // resized and served as AVIF/WebP instead of the raw originals.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 604800,
  },
  async redirects() {
    return [
      // /import was the vehicle page until the section was split into "for
      // sale" and "import" under /cars. These are permanent because the old
      // URLs were indexed and shared — losing them would lose the traffic.
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
