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
    // Use getUser() instead of getSession() for secure server-side authentication
    // This method authenticates the data by contacting the Supabase Auth server
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
    //   console.log('User authentication error:', userError.message);
      return { user: null, error: `Authentication error: ${userError.message}` };
    }

    if (!user) {
    //   console.log('No authenticated user found');
      return { user: null, error: 'No authenticated user found' };
    }

    // User is authenticated and verified by Supabase Auth server
    // console.log('User authenticated securely:', user.id);
    return { user, error: null };
    
  } catch (error) {
    // console.error('Exception in getServerUser:', error);
    return { 
      user: null, 
      error: error instanceof Error ? error.message : 'Authentication error'
    };
  }
} 