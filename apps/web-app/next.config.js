/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [],
  productionBrowserSourceMaps: false,
  
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