import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters } from './lib/rateLimit';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply rate limiting to API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Skip rate limiting for these routes that handle their own feature limits
  const skipRateLimitRoutes = [
    '/api/resume/create',
    '/api/resume/optimize',
    '/api/user/usage',
    '/api/debug-usage',
    '/api/reset-usage'
  ];

  if (skipRateLimitRoutes.some(route => pathname.includes(route))) {
    return NextResponse.next();
  }

  // Apply IP-based rate limiting for other routes
  let limiter;

  if (pathname.includes('/resume/score')) {
    limiter = rateLimiters.ai;
  } else if (pathname.includes('/auth/')) {
    limiter = rateLimiters.auth;
  } else if (pathname.includes('/upload') || pathname.includes('/file')) {
    limiter = rateLimiters.upload;
  } else if (pathname.includes('/user/')) {
    limiter = rateLimiters.user;
  } else {
    limiter = rateLimiters.api;
  }

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