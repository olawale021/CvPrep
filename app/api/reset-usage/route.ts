import { NextRequest, NextResponse } from 'next/server';
import { isUserAdmin } from '../../../lib/auth/adminConfig';
import { getServerUser } from '../../../lib/auth/supabase-server';
import { supabaseAdmin } from '../../../lib/auth/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    // Get user using proper SSR authentication
    const { user, error: authError } = await getServerUser(req);
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Service configuration error' 
      }, { status: 500 });
    }

    // Check if user is admin
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('type')
      .eq('id', user.id)
      .single();

    // Use centralized admin check
    const isAdmin = isUserAdmin({
      email: user.email,
      type: userData?.type
    });

    if (!isAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    // Get request body for user to reset
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    // Reset the user's daily usage by deleting their records for today
    const today = new Date().toISOString().split('T')[0];
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';

    const { error: deleteError } = await supabaseAdmin
      .from('user_daily_usage')
      .delete()
      .eq('user_id', userId)
      .eq('usage_date', today)
      .eq('environment', environment);

    if (deleteError) {
      console.error('Error resetting usage:', deleteError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to reset usage' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Usage reset for user ${userId} on ${today} in ${environment}`
    });

  } catch (error) {
    console.error('Reset usage API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 