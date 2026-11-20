import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    cpus: 2,
  },
};

export default nextConfig;

