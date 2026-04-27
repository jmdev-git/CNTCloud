import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https' as const,
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https' as const,
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https' as const,
        hostname: '192.168.50.10',
      },
    ],
  },
};

export default nextConfig;
