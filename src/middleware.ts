import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// List of paths that require authentication
const protectedPaths = [
  '/dashboard',
  '/profile',
  '/settings',
  '/resume-builder',
  '/interview-prep',
  '/cover-letter',
  '/applications',
  '/calendar',
  '/career-roadmap',
];

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

// Auth.js middleware handles protected routes and authentications
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    
    // Skip middleware for excluded paths
    if (excludedPaths.some(path => pathname.startsWith(path)) || pathname.includes('.')) {
      return NextResponse.next();
    }
    
    // Check if path is protected
    const isProtectedPath = protectedPaths.some(path => 
      pathname === path || pathname.startsWith(`${path}/`)
    );
    
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
    
    // If it's not a protected path, always allow the request
    if (!isProtectedPath) {
      return response;
    }
    
    // If we get here, it's a protected path and Auth.js will handle authentication
    return response;
  },
  {
    callbacks: {
      // Only run middleware on protected paths
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        const isProtectedPath = protectedPaths.some(path => 
          pathname === path || pathname.startsWith(`${path}/`)
        );
        
        // For protected paths, verify token exists
        if (isProtectedPath) {
          return !!token;
        }
        
        // For non-protected paths, always allow access
        return true;
      },
    },
    pages: {
      // Simple signIn configuration without redirect parameters
      signIn: '/',
    }
  }
);

// Configure matcher to specifically include paths we want to run middleware on
export const config = {
  matcher: [
    // Include all paths except excluded ones defined in the excluded paths array
    '/((?!_next/static|_next/image|favicon.ico).*)',
    // Explicitly match auth callback routes to apply headers
    '/api/auth/:path*',
    '/auth/callback/:path*',
  ],
}; 