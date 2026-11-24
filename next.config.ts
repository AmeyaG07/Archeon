import type { NextConfig } from "next";

const backendUrl = process.env.INTERNAL_BACKEND_URL || "http://localhost:8080";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  experimental: {
    cpus: 2,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
