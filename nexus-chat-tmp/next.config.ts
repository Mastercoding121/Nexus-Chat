import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    optimizeCss: false,
  },
};

export default nextConfig;
