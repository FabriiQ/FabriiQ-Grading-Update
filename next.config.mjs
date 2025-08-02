/** @type {import('next').NextConfig} */
const config = {
  images: {
    remotePatterns: [],
  },
  reactStrictMode: true,

  // Performance optimizations
  serverExternalPackages: ['@prisma/client', '@prisma/engines'],

  // Build optimizations to prevent memory issues
  eslint: {
    // Disable ESLint during build to save memory
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },

  typescript: {
    // Skip type checking during build in production (run separately)
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },

  experimental: {
    // Disable view transitions by default for better performance
    viewTransition: process.env.DISABLE_VIEW_TRANSITIONS !== 'true',
    scrollRestoration: true,
    // Package import optimization
    optimizePackageImports: ['@prisma/client', 'lucide-react', '@radix-ui/react-icons'],
    // Memory optimizations
    workerThreads: false,
    cpus: 1,
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  // Add caching headers for better performance
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        source: '/h5p/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/admin/campus/classes/:id/actvity',
        destination: '/admin/campus/classes/:id/activities',
      },
      {
        source: '/admin/campus/classes/:id/assignments',
        destination: '/admin/campus/classes/:id/assessments',
      },
      {
        source: '/admin/campus/classes/:id/assignments/create',
        destination: '/admin/campus/classes/:id/assessments/new',
      },
      {
        source: '/admin/campus/classes/:id/assignments/:assignmentId',
        destination: '/admin/campus/classes/:id/assessments/:assignmentId',
      },
      {
        source: '/admin/campus/classes/:id/assignments/:assignmentId/edit',
        destination: '/admin/campus/classes/:id/assessments/:assignmentId/edit',
      },
      // Add worksheets routes
      {
        source: '/worksheets',
        destination: '/app/(teacher)/worksheets',
      },
      {
        source: '/worksheets/create',
        destination: '/app/(teacher)/worksheets/create',
      },
      {
        source: '/worksheets/:id',
        destination: '/app/(teacher)/worksheets/:id',
      },
    ];
  },
};

export default config;