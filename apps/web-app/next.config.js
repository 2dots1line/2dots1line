/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [],
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
}

module.exports = nextConfig 