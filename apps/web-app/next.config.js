/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@2dots1line/ui-components', '@2dots1line/shared-types'],
  productionBrowserSourceMaps: false,
  
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable source maps in development
      config.devtool = false;
    }
    return config;
  },
  
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:3001/api/v1/:path*',
      },
    ];
  },

  // Skip type-checking in Next build (we rely on tsc builds in the monorepo)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Skip ESLint during Next build (optional)
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig