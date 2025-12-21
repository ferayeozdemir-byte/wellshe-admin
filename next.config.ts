import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: false,

  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // istersen "5mb" / "20mb"
    },
  },
};

export default nextConfig;
