import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'febraca.org.br',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'arcanimal.com.br',
        pathname: '/assets/**',
      },
    ],
  },
};

export default nextConfig;
