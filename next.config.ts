import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    // Don't fail the production build on ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't fail production builds on type errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
