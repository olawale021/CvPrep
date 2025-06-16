import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/auth/supabaseClient';

export async function GET(req: NextRequest) {
  try {
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

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, type, created_at')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get today's usage
    const today = new Date().toISOString().split('T')[0];
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    
    const { data: usageData, error: usageError } = await supabase
      .from('user_daily_usage')
      .select('*')
      .eq('user_id', userData.id)
      .eq('usage_date', today)
      .eq('environment', environment);

    // Calculate trial days remaining
    const createdDate = new Date(userData.created_at);
    const expiryDate = new Date(createdDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
    const now = new Date();
    const trialDaysRemaining = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

    return NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        type: userData.type,
        created_at: userData.created_at,
        trialDaysRemaining
      },
      environment,
      today,
      usage: usageData || [],
      usageError: usageError?.message || null,
      limits: {
        resume_create: 1,
        resume_optimize: 1,
        cover_letter_create: 1,
        cover_letter_optimize: 1,
        interview_prep: 3
      }
    });

  } catch (error) {
    console.error('Debug usage error:', error);
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 