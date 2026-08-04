import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    // Rust port of the React Compiler — runs natively in Turbopack instead of
    // going through Babel, which makes it the single biggest dev/build win here.
    turbopackRustReactCompiler: true,
    optimizePackageImports: ['lucide-react', 'simple-icons', 'streamdown'],
  },
  async headers() {
    return [
      // PWA icons rarely change — long-cache so they aren't re-fetched when the
      // browser re-parses the manifest on each client navigation.
      {
        source: '/icons/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }],
      },
      // Override Vercel's default `max-age=0, must-revalidate` for the manifest.
      {
        source: '/manifest.webmanifest',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }],
      },
    ]
  },
}

export default withNextIntl(nextConfig)
