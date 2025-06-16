import { CookieOptions, createServerClient } from '@supabase/ssr';
import { NextRequest } from 'next/server';

// Server-side Supabase client factory for API routes
export function createServerSupabaseClient(request?: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (request) {
    // For API routes with NextRequest
    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        set(name: string, value: string, options: CookieOptions) {
          // For API routes, we typically don't set cookies
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        remove(name: string, options: CookieOptions) {
          // For API routes, we typically don't remove cookies
        },
      },
    });
  } else {
    // For server components using next/headers - this path is not used in API routes
    throw new Error('Server components not supported in this context');
  }
}

// Helper function to get authenticated user from server
export async function getServerUser(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  
  try {
    // First try to get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('Session error:', sessionError.message);
      return { user: null, error: `Session error: ${sessionError.message}` };
    }

    if (!session) {
      console.log('No session found');
      return { user: null, error: 'No session found' };
    }

    if (!session.user) {
      console.log('Session exists but no user');
      return { user: null, error: 'Session exists but no user' };
    }

    // Session and user exist, return the user
    console.log('User authenticated:', session.user.id);
    return { user: session.user, error: null };
    
  } catch (error) {
    console.error('Exception in getServerUser:', error);
    return { 
      user: null, 
      error: error instanceof Error ? error.message : 'Authentication error' 
    };
  }
} 