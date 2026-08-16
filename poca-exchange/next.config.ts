import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "biasroomcdn.com",
      },
      {
        protocol: "https",
        hostname: "coverartarchive.org",
      },
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.imgur.com",
      },
      {
        protocol: "https",
        hostname: "**.pstatic.net",
      },
    ],
  },
  redirects: async () => [
    {
      source: "/auth/signin",
      destination: "/auth/login",
      permanent: true, // 308 Permanent Redirect
    },
  ],
};

export default nextConfig;
