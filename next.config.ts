import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  experimental: {
    serverActions: {
      // Keep transport overhead above the service-enforced 2 MB logo limit.
      bodySizeLimit: "3mb"
    }
  },
  images: {
    qualities: [75, 88]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=()"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
