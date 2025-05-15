import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Paths to exclude from middleware processing
const excludedPaths = [
  '/_next',
  '/api',
  '/favicon.ico',
  '/static',
  '/images',
  '/__nextjs_original-stack-frame',
];

// Paths that should have logging suppressed
const logSuppressedPaths = [
  '/api/auth',
  '/auth',
  '/callback',
];

// Use a simplified middleware approach for Vercel 
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    
    // Skip middleware for excluded paths
    if (excludedPaths.some(path => pathname.startsWith(path)) || pathname.includes('.')) {
      return NextResponse.next();
    }
    
    // Check if path should have logging suppressed
    const shouldSuppressLogs = logSuppressedPaths.some(path => 
      pathname.includes(path)
    );
    
    // Create response
    const response = NextResponse.next();
    
    // Add header to suppress logging for sensitive paths
    if (shouldSuppressLogs) {
      response.headers.set('x-exclude-logging', 'true');
    }
    
    // For non-protected paths, always allow
    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,  // Simplify to just check for token existence
    },
    pages: {
      signIn: '/', // Redirect to home page if unauthenticated
    },
  }
);

// Configure matcher to run only on protected routes
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/resume-builder/:path*',
    '/interview-prep/:path*',
    '/cover-letter/:path*',
    '/applications/:path*',
    '/calendar/:path*',
    '/career-roadmap/:path*',
  ],
}; 