import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Get query parameters from URL
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  
  if (!code) {
    console.error('No code provided in auth callback');
    return NextResponse.redirect(new URL('/?error=Missing+auth+code', req.url));
  }
  
  // Redirect to the NextAuth callback URL which will handle the authentication
  const baseUrl = new URL('/', req.url).origin;
  const redirectUrl = new URL('/api/auth/callback/google', baseUrl);
  
  // Add the necessary parameters
  redirectUrl.searchParams.set('code', code);
  
  // Add state if present
  const state = searchParams.get('state');
  if (state) {
    redirectUrl.searchParams.set('state', state);
  }
  
  
  
  // Redirect to the NextAuth callback
  return NextResponse.redirect(redirectUrl);
} 