import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// This middleware protects routes and handles authentication with Supabase
export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  
  // Create a Supabase client for the middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );
  
  // Get the session - if it exists, the user is authenticated
  const { data: { session } } = await supabase.auth.getSession();

  // These are the paths that do not require authentication
  const publicPaths = [
    '/',
    '/login',
    '/about',
    '/contact',
    '/pricing',
    '/terms',
    '/privacy',
    '/api/auth',
    '/api/webhook',
    '/auth/callback',
  ];
  
  // Check if the current path is a public path
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || 
    request.nextUrl.pathname.startsWith(`${path}/`)
  );
  
  // If not a public path and not authenticated, redirect to login
  if (!isPublicPath && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return res;
}

// Configure matcher to only run middleware on paths that need it
export const config = {
  matcher: [
    // Exclude static files
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 