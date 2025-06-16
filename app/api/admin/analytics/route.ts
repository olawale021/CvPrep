import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '../../../../lib/auth/supabase-server';
import { supabaseAdmin } from '../../../../lib/auth/supabaseClient';

export async function GET(req: NextRequest) {
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
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('type')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.type !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    // Fetch analytics data
    const { data: usageStats, error: usageError } = await supabaseAdmin
      .from('user_daily_usage')
      .select('*')
      .order('usage_date', { ascending: false })
      .limit(30); // Last 30 days

    const { data: userStats, error: userStatsError } = await supabaseAdmin
      .from('users')
      .select('id, email, type, created_at')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      analytics: {
        usageStats: usageStats || [],
        userStats: userStats || [],
        usageError: usageError?.message || null,
        userStatsError: userStatsError?.message || null
      }
    });

  } catch (error) {
    console.error('Admin analytics API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 