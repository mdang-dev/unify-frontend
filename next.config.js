const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
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
