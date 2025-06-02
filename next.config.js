/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Keep existing TypeScript config
    ignoreBuildErrors: false,
  },
  // Environment variables
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  },
}

module.exports = nextConfig