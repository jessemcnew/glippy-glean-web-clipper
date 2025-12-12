import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // Static export doesn't need image optimization
  images: {
    unoptimized: true,
  },
  // Trailing slashes for static file serving
  trailingSlash: true,
  // Disable inline scripts for Chrome extension CSP compliance
  // This prevents Next.js from using inline <script> tags
  experimental: {
    // Use external scripts instead of inline
  },
};

export default nextConfig;
