/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Enable standalone output for Docker
  experimental: {
    // Suppress async params warnings for pages that don't use them
    missingSuspenseWithCSRBailout: false,
  },
}

module.exports = nextConfig

