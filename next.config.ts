import type { Configuration } from 'webpack';

const nextConfig = {
  // Disable server logs for sensitive requests
  serverRuntimeConfig: {
    // These settings will only be available on the server
    suppressAuthLogs: true,
  },
  
  // Add image domains configuration for Google user profile images
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'googleusercontent.com',
      'avatars.githubusercontent.com'
    ],
  },
  
  // Create custom rewrite rules to handle the sensitive routes
  async rewrites() {
    return [
      // This rewrite helps hide the sensitive callback URLs from logs
      {
        source: '/auth/callback/:provider*',
        destination: '/api/auth/callback/:provider*',
        locale: false,
      },
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
        locale: false,
      },
    ];
  },
  
  // Add secure headers to sensitive routes
  async headers() {
    return [
      {
        source: '/(api/auth|auth)/:path*',
        headers: [
          {
            key: 'x-exclude-logging',
            value: 'true',
          },
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
  
  // Disable source maps in production to prevent exposing source
  productionBrowserSourceMaps: false,
  
  // Set stricter Content Security Policy
  poweredByHeader: false,
  
  env: {
    // Flag to help conditionally disable logs
    DISABLE_AUTH_LOGS: 'true',
  },
  
  // Configure external packages for server components
  serverExternalPackages: ['next-auth', 'pdf-parse'],
  
  // Configure webpack to handle pdf.js and other binary files
  webpack: (config: Configuration, { isServer }: { isServer: boolean }) => {
    // Handle pdf-parse module for server-side
    if (isServer) {
      if (config.externals) {
        config.externals = [...(config.externals as string[]), 'canvas', 'jsdom'];
      }
    }
    
    return config;
  },
};

export default nextConfig;
