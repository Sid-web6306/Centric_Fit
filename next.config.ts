import type { NextConfig } from "next";

// Use Vercel's deployment ID or git commit SHA for version checking
// Falls back to timestamp for local development
const buildId = process.env.VERCEL_DEPLOYMENT_ID 
  || process.env.VERCEL_GIT_COMMIT_SHA 
  || process.env.NEXT_PUBLIC_BUILD_ID 
  || Date.now().toString();

const nextConfig: NextConfig = {
  // Expose build ID for version checking
  generateBuildId: async () => buildId,
  env: {
    NEXT_PUBLIC_BUILD_ID: buildId,
    // Also expose the Vercel deployment URL if available
    NEXT_PUBLIC_VERCEL_URL: process.env.VERCEL_URL || '',
  },
  images: {
    remotePatterns: [
      // Google OAuth profile pictures
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh4.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh5.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh6.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      // Supabase storage (replace with your actual project domain)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // GitHub avatars (if using GitHub OAuth)
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      // Gravatar (common fallback for email-based avatars)
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
        port: '',
        pathname: '/avatar/**',
      },
      {
        protocol: 'https',
        hostname: 'gravatar.com',
        port: '',
        pathname: '/avatar/**',
      },
    ],
  },
};

export default nextConfig;
