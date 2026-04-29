import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone',
  experimental: { typedRoutes: true },
  env: {
    NEXT_PUBLIC_API_URL:      process.env.NEXT_PUBLIC_API_URL      ?? 'http://localhost:4000',
    NEXT_PUBLIC_REALTIME_URL: process.env.NEXT_PUBLIC_REALTIME_URL ?? 'http://localhost:4001',
    NEXT_PUBLIC_STRIPE_KEY:   process.env.NEXT_PUBLIC_STRIPE_KEY   ?? '',
  },
};

export default config;
