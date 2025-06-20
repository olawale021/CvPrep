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

    //  admin check
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

    // Get environment from query params
    const { searchParams } = new URL(req.url);
    const environment = searchParams.get('environment') || 'production';

    // Fetch analytics data
    const { data: usageStats } = await supabaseAdmin
      .from('user_daily_usage')
      .select('*')
      .eq('environment', environment)
      .order('usage_date', { ascending: false })
      .limit(30); // Last 30 days

    // Fetch user stats
    const { data: allUsers } = await supabaseAdmin
      .from('users')
      .select('id, email, type, created_at')
      .order('created_at', { ascending: false });

    // Aggregate feature analytics
    const featureAnalytics = new Map();
    const dailyTrends = new Map();
    const userUsageMap = new Map();

    if (usageStats) {
      usageStats.forEach(stat => {
        // Feature analytics
        const key = stat.feature_type;
        if (!featureAnalytics.has(key)) {
          featureAnalytics.set(key, {
            feature_type: key,
            environment: stat.environment,
            total_count: 0,
            success_count: 0,
            failure_count: 0,
            avg_processing_time_ms: 0,
            last_updated: stat.created_at
          });
        }
        const feature = featureAnalytics.get(key);
        feature.total_count += stat.count;
        feature.success_count += stat.success_count || stat.count; // Assume success if not specified
        feature.failure_count += stat.failure_count || 0;

        // Daily trends
        const dateKey = stat.usage_date;
        if (!dailyTrends.has(dateKey)) {
          dailyTrends.set(dateKey, {
            date: dateKey,
            total_requests: 0,
            successful_requests: 0,
            failed_requests: 0,
            features: {}
          });
        }
        const trend = dailyTrends.get(dateKey);
        trend.total_requests += stat.count;
        trend.successful_requests += stat.success_count || stat.count;
        trend.failed_requests += stat.failure_count || 0;
        trend.features[stat.feature_type] = (trend.features[stat.feature_type] || 0) + stat.count;

        // User usage for top users
        if (!userUsageMap.has(stat.user_id)) {
          userUsageMap.set(stat.user_id, 0);
        }
        userUsageMap.set(stat.user_id, userUsageMap.get(stat.user_id) + stat.count);
      });
    }

    // Calculate user stats
    const userStats = {
      total: allUsers?.length || 0,
      free: allUsers?.filter(u => !u.type || u.type === 'free').length || 0,
      premium: allUsers?.filter(u => u.type === 'premium').length || 0
    };

    // Get top users
    const topUsers = Array.from(userUsageMap.entries())
      .map(([userId, usage]) => {
        const user = allUsers?.find(u => u.id === userId);
        return {
          user_id: userId,
          email: user?.email || 'Unknown',
          type: user?.type || 'free',
          total_usage: usage
        };
      })
      .sort((a, b) => b.total_usage - a.total_usage)
      .slice(0, 10);

    return NextResponse.json({
      analytics: Array.from(featureAnalytics.values()),
      userStats,
      trends: Array.from(dailyTrends.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      topUsers,
      environment,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin analytics API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 