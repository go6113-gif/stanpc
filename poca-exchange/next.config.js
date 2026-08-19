/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/api/image.*",
        search: ".*",
      },
      {
        pathname: "/images/photocards/.*",
        search: ".*",
      },
    ],
  },
};

module.exports = nextConfig;
