import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    unoptimized: true, // Required for static export (Capacitor)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  output: 'export', // Force static export for Capacitor APK generation
};

export default nextConfig;
