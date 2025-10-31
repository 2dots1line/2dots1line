/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@2dots1line/ui-components', '@2dots1line/shared-types'],
  productionBrowserSourceMaps: false,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  
  // Allow mobile devices to access the development server
  allowedDevOrigins: [
    '172.20.10.3',
    '192.168.68.63',
    'localhost',
    '127.0.0.1'
  ],
  
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = false;
    }
    // Prevent bundler from trying to polyfill Node builtins in client
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      path: false,
    };
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