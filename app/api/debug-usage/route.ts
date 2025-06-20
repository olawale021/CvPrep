import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '../../../lib/auth/supabase-server';
import { supabaseAdmin } from '../../../lib/auth/supabaseClient';

export async function GET(req: NextRequest) {
  // Disable debug endpoint in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      error: 'Debug endpoint disabled in production'
    }, { status: 404 });
  }

  try {
    // Get user using proper SSR authentication
    const { user, error: authError } = await getServerUser(req);
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required',
        authError 
      }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Service configuration error' 
      }, { status: 500 });
    }

    // Fetch user data from database
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        authenticated: true
      },
      userData,
      userError
    });

  } catch (error) {
    console.error('Debug usage API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 