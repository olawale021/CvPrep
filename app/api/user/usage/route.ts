import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '../../../../lib/auth/supabase-server';
import { supabaseAdmin } from '../../../../lib/auth/supabaseClient';
import { FREE_TRIAL_DAYS, FREE_USER_LIMITS, FeatureType } from '../../../../lib/auth/userRateLimit';

// Get current environment
const getCurrentEnvironment = (): 'production' | 'development' => {
  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
};

export async function GET(req: NextRequest) {
  try {
    // Get user using proper SSR authentication
    const { user, error: authError } = await getServerUser(req);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // We need supabaseAdmin for database queries due to RLS
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service configuration error' }, { status: 500 });
    }

    // Get user data from database
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, type, created_at')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    // Premium users don't need usage tracking
    if (userData.type === 'premium') {
      return NextResponse.json({ premium: true });
    }

    // Calculate trial days remaining
    const createdDate = new Date(userData.created_at);
    const expiryDate = new Date(createdDate.getTime() + (FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000));
    const now = new Date();
    const trialDaysRemaining = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

    // Get today's usage from database
    const today = new Date().toISOString().split('T')[0];
    const environment = getCurrentEnvironment();
    
    // Fetch actual usage data from database
    const { data: usageData, error: usageError } = await supabaseAdmin
      .from('user_daily_usage')
      .select('feature_type, count')
      .eq('user_id', userData.id)
      .eq('usage_date', today)
      .eq('environment', environment);

    if (usageError) {
      console.error('Error fetching usage data:', usageError);
      return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
    }

    // Convert usage data to the expected format
    const usageMap = new Map();
    if (usageData) {
      usageData.forEach(item => {
        usageMap.set(item.feature_type, {
          used: item.count || 0
        });
      });
    }

    // Build usage response with all features
    const featureTypes: FeatureType[] = [
      'resume_create',
      'resume_optimize', 
      'cover_letter_create',
      'cover_letter_optimize',
      'personal_statement_create',
      'interview_prep'
    ];

    const usage = featureTypes.reduce((acc, feature) => {
      const featureUsage = usageMap.get(feature);
      acc[feature] = {
        used: featureUsage?.used || 0,
        limit: FREE_USER_LIMITS[feature]
      };
      return acc;
    }, {} as Record<string, { used: number; limit: number }>);

    return NextResponse.json({
      ...usage,
      trialDaysRemaining,
      environment
    });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}