import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters } from './lib/rateLimit';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply rate limiting to API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  let limiter;

  // Determine which rate limiter to use based on the route
  if (pathname.includes('/resume/score') || pathname.includes('/resume/optimize')) {
    // AI-powered endpoints - most restrictive
    limiter = rateLimiters.ai;
  } else if (pathname.includes('/auth/')) {
    // Authentication endpoints
    limiter = rateLimiters.auth;
  } else if (pathname.includes('/upload') || pathname.includes('/file')) {
    // File upload endpoints
    limiter = rateLimiters.upload;
  } else if (pathname.includes('/user/')) {
    // User data endpoints
    limiter = rateLimiters.user;
  } else {
    // General API endpoints
    limiter = rateLimiters.api;
  }

  // Apply rate limiting
  const rateLimitResponse = await limiter.createMiddleware()(request);
  
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 