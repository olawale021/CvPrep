import { NextRequest, NextResponse } from 'next/server';
import { isUserAdmin } from '../../../../lib/auth/adminConfig';
import { getServerUser } from '../../../../lib/auth/supabase-server';
import { supabaseAdmin } from '../../../../lib/auth/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    // Get user using proper SSR authentication
    const { user, error: authError } = await getServerUser(req);
    
    if (authError || !user) {
      return NextResponse.json({ 
        isAdmin: false,
        authenticated: false 
      });
    }

    // Get user data from database if available
    let isAdmin = false;
    
    if (supabaseAdmin) {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('type')
        .eq('id', user.id)
        .single();

      // Check admin status using centralized function
      isAdmin = isUserAdmin({
        email: user.email,
        type: userData?.type,
      });
    }

    return NextResponse.json({
      isAdmin,
      authenticated: true,
      email: user.email,
    });

  } catch (error) {
    console.error('Admin check API error:', error);
    return NextResponse.json({ 
      isAdmin: false,
      authenticated: false,
      error: 'Internal server error'
    });
  }
} 