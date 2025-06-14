import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    // Get user from auth token
    const authHeader = req.headers.get('Authorization');
    const sessionCookie = req.cookies.get('sb-access-token')?.value;
    const token = authHeader?.replace('Bearer ', '') || sessionCookie;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Delete all usage records for today for this user
    const today = new Date().toISOString().split('T')[0];
    const environment = (process.env.NODE_ENV as string) === 'production' ? 'production' : 'development';
    
    const { error: deleteError } = await supabase
      .from('user_daily_usage')
      .delete()
      .eq('user_id', user.id)
      .eq('usage_date', today)
      .eq('environment', environment);

    if (deleteError) {
      console.error('Error resetting usage:', deleteError);
      return NextResponse.json({ error: 'Failed to reset usage' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Usage reset successfully for testing',
      user_id: user.id,
      date: today,
      environment 
    });

  } catch (error) {
    console.error('Reset usage error:', error);
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 