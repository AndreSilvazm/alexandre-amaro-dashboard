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
    ],
  },
};

export default nextConfig;
