import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getServerUser } from '../../../lib/auth/supabase-server';

export async function GET(req: NextRequest) {
  // Disable debug endpoint in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      error: 'Debug endpoint disabled in production'
    }, { status: 404 });
  }

  try {
    // Get all cookies for debugging
    const allCookies = req.cookies.getAll();
    
    // Get specific Supabase-related cookies
    const supabaseCookies = allCookies.filter(cookie => 
      cookie.name.includes('sb-') || 
      cookie.name.includes('supabase') ||
      cookie.name.includes('auth')
    );

    const debugInfo = {
      totalCookies: allCookies.length,
      supabaseCookies: supabaseCookies.map(c => ({
        name: c.name,
        valueLength: c.value?.length || 0,
        valueStart: c.value?.substring(0, 50) + '...'
      })),
      allCookieNames: allCookies.map(c => c.name),
      environment: process.env.NODE_ENV,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      userAgent: req.headers.get('user-agent'),
      origin: req.headers.get('origin'),
    };



    // Try to get user using new SSR method
    const { user, error: authError } = await getServerUser(req);
    
    if (authError || !user) {
      // Also try manual session check
      const supabase = createServerSupabaseClient(req);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      return NextResponse.json({ 
        error: 'Authentication failed',
        authError,
        sessionError: sessionError?.message,
        hasSession: !!session,
        sessionUser: session?.user?.id,
        debug: debugInfo
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      userEmail: user.email,
      debug: debugInfo
    });
  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 