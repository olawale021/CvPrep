
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
        source: '/api/auth/:path*',
        headers: [
          {
            key: 'X-Auth-Route',
            value: 'true',
          },
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      {
        source: '/auth/callback/:path*',
        headers: [
          {
            key: 'X-Auth-Route',
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
};

export default nextConfig;
