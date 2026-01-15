/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Exclude ngrok from webpack bundling (native binary)
  serverExternalPackages: ['@ngrok/ngrok'],
}

module.exports = nextConfig

