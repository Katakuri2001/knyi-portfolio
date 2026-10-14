import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Export static HTML for Cloudflare Pages deployment
  output: "export",
  reactStrictMode: true,
  // Turbopack disabled - use webpack compiler
  webpack: (config) => {
    config.module.rules.push({
      test: /\.css$/i,
      use: ['postcss-loader'],
    });
    return config;
  },
  // Images configuration for static export
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
