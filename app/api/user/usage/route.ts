import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';
import { FREE_TRIAL_DAYS, FREE_USER_LIMITS, FeatureType } from '../../../../lib/userRateLimit';

// Get current environment
const getCurrentEnvironment = (): 'production' | 'development' => {
  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
};

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
      .select('id, type, created_at')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
    const { data: usageData, error: usageError } = await supabase
      .from('user_daily_usage')
      .select('feature_type, count')
      .eq('user_id', userData.id)
      .eq('usage_date', today)
      .eq('environment', environment);

    if (usageError) {
      console.error('Error fetching usage data:', usageError);
      // Return default values on error
      const usage = {
        resume_create: { used: 0, limit: FREE_USER_LIMITS.resume_create },
        resume_optimize: { used: 0, limit: FREE_USER_LIMITS.resume_optimize },
        cover_letter_create: { used: 0, limit: FREE_USER_LIMITS.cover_letter_create },
        cover_letter_optimize: { used: 0, limit: FREE_USER_LIMITS.cover_letter_optimize },
        interview_prep: { used: 0, limit: FREE_USER_LIMITS.interview_prep },
        trialDaysRemaining
      };
      return NextResponse.json(usage);
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