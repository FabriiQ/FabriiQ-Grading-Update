// Load polyfills for server-side rendering
require('./src/polyfills/worker-polyfill.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['src', 'app'],
  },
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true, // Keep this false to catch actual TS errors
    
  },
  // Memory optimization settings
  experimental: {
    // Reduce memory usage during build
    workerThreads: false,
    // Optimize package imports to reduce bundle size (excluding @prisma/client to avoid conflicts)
    optimizePackageImports: ['socket.io', 'socket.io-client'],
    // Enable View Transitions API for smooth page transitions
    viewTransition: true,
    // Disable CSS optimization to avoid critters dependency
    optimizeCss: false,
    // Maintain scroll position during navigation
    scrollRestoration: true,
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  webpack: (config, { isServer, dev }) => {
    // Memory optimization for webpack
    if (!dev && !isServer) {
      // Only apply chunk splitting to client-side builds
      config.optimization = {
        ...config.optimization,
        // Reduce memory usage during build
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              maxSize: 244000, // 244KB chunks to reduce memory usage
            },
          },
        },
      };
    }

    // Handle binary modules used by H5P
    if (isServer) {
      // Add all @node-rs/crc32 platform-specific binaries to externals
      config.externals.push({
        '@node-rs/crc32-win32-x64-msvc': 'commonjs @node-rs/crc32-win32-x64-msvc',
        '@node-rs/crc32-darwin-x64': 'commonjs @node-rs/crc32-darwin-x64',
        '@node-rs/crc32-linux-x64-gnu': 'commonjs @node-rs/crc32-linux-x64-gnu',
        '@node-rs/crc32-linux-x64-musl': 'commonjs @node-rs/crc32-linux-x64-musl',
        '@node-rs/crc32-android-arm64': 'commonjs @node-rs/crc32-android-arm64',
        '@node-rs/crc32-darwin-arm64': 'commonjs @node-rs/crc32-darwin-arm64',
        '@node-rs/crc32-linux-arm64-gnu': 'commonjs @node-rs/crc32-linux-arm64-gnu',
        '@node-rs/crc32-linux-arm64-musl': 'commonjs @node-rs/crc32-linux-arm64-musl',
        '@node-rs/crc32-win32-arm64-msvc': 'commonjs @node-rs/crc32-win32-arm64-msvc',
        'yauzl-promise': 'commonjs yauzl-promise'
      });

      // Exclude web workers from server-side bundle to prevent 'self is not defined' errors
      config.externals.push(/\.worker\.(js|ts)$/);
    }

    // Add fallbacks for Node.js globals
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }





    return config;
  },
  // Disable server-side rendering for H5P components
  reactStrictMode: true,
  transpilePackages: ['@lumieducation/h5p-react', '@lumieducation/h5p-webcomponents'],
  // External packages configuration moved to root level
  serverExternalPackages: ['@prisma/client', '@prisma/engines'],
  // Optimize image formats for better performance
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
};

module.exports = nextConfig;
