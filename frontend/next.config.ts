import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'retail.photos.vin', // Keep Auto.dev (just in case)
      },
      {
        protocol: 'https',
        hostname: 'platform.cstatic-images.com', // <--- IMPORTANT: Cars.com image server
      },
      {
        protocol: 'https',
        hostname: '*.cars.com', // Catch-all for cars.com subdomains
      },
    ],
  },
};

export default nextConfig;