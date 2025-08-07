const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  // Suppress source map warnings in development
  webpack: (config, { dev }) => {
    if (dev) {
      config.ignoreWarnings = [
        /Failed to parse source map/,
        /Source map error/,
      ];
      // Disable source maps in development to prevent 404 errors
      config.devtool = false;
    }
    return config;
  },
  // Optimize font loading and reduce preload warnings
  experimental: {
    // Font optimization is enabled by default in Next.js 15
  },
  async rewrites() {
    return [
      {
        source: '/:locale/sounds/:path*',
        destination: '/sounds/:path*',
      },
      {
        source: '/:locale/images/:path*',
        destination: '/images/:path*',
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
