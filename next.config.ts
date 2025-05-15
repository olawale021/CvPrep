const nextConfig = {
  // Disable server logs for sensitive requests
  serverRuntimeConfig: {
    // These settings will only be available on the server
    suppressAuthLogs: true,
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
  serverExternalPackages: ['next-auth'],

  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/?callbackUrl=/dashboard',
        permanent: false,
        // This condition checks if the user is NOT authenticated
        // by looking for the absence of the session token cookie.
        // The exact cookie name might vary based on your NextAuth.js setup,
        // but 'next-auth.session-token' or '__Secure-next-auth.session-token' are common.
        missing: [
          {
            type: 'cookie',
            key: 'next-auth.session-token', // Or '__Secure-next-auth.session-token' if using HTTPS
          },
           {
            type: 'cookie',
            key: '__Secure-next-auth.session-token', 
          }
        ],
      },
    ];
  },
};

export default nextConfig;
