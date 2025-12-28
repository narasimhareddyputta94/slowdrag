import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  experimental: {
    // Helps reduce client bundle size for large libraries by optimizing import paths.
    optimizePackageImports: [
      "three",
      "@react-three/fiber",
      "@react-three/drei",
      "framer-motion",
      "lenis",
    ],
  },
};

export default nextConfig;
