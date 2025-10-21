/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@2dots1line/ui-components', '@2dots1line/shared-types'],
  reactStrictMode: false, // Disable for cloud dev mode
  eslint: { 
    ignoreDuringBuilds: true,
    dirs: ['src']
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
  webpack: (config, { isServer }) => {
    // Suppress all warnings that could cause build issues
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
      };
    }
    // Suppress all warnings
    config.ignoreWarnings = [() => true];
    return config;
  },
};

module.exports = nextConfig