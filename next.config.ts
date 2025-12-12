
import type {NextConfig} from 'next';
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
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
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

// Cast the withPWA result to 'any' to ignore conflicting internal types.
// We then cast it to the correct function signature to ensure the argument is NextConfig.
const pwaConfig: (config: NextConfig) => NextConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
}) as any; // <--- ADDED 'as any' HERE

// Now apply the config and cast the final result to NextConfig for safety.
export default pwaConfig(nextConfig) as NextConfig; // <--- ADDED 'as NextConfig' HERE
