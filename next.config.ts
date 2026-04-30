import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https" as const,
        hostname: "192.168.50.100",
      },
      {
        protocol: "https" as const,
        hostname: "192.168.50.10",
      },
      {
        protocol: "https" as const,
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https" as const,
        hostname: "picsum.photos",
      },
      {
        protocol: "https" as const,
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Tell Next.js it's behind an HTTPS reverse proxy
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Forwarded-Proto", value: "https" },
        ],
      },
    ];
  },
};

export default nextConfig;
