import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: false,

  experimental: {
    serverActions: {
      // Server Actions ile gelen upload’lar için limit
      bodySizeLimit: "20mb",
    },
  },

  // Eski tip API route’lar vs. için de güvenli olsun
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

export default nextConfig;
