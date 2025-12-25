import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: false,

  experimental: {
    serverActions: {
      // Server Actions ile gelen upload’lar için limit
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
