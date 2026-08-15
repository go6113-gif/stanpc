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
      source: "/auth/login",
      destination: "/auth/signin",
      permanent: false, // 301 대신 302 (임시 리다이렉트)
    },
  ],
};

export default nextConfig;
