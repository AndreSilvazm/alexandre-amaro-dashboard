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
      {
        protocol: 'https',
        hostname: 'assets.codante.io',
        pathname: '/codante-apis/bandeiras-dos-estados/**',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
