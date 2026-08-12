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
};

export default nextConfig;
