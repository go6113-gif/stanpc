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
