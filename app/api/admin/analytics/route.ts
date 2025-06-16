import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/auth/supabaseClient';

// Check if user is admin (you may want to implement proper admin role checking)
async function isAdmin(token: string): Promise<boolean> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return false;
    }

    // Get user data to check if admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, type')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return false;
    }

    // Check if user is admin (you can modify this logic)
    // For now, checking if email contains 'admin' or if they're premium
    return userData.email?.includes('admin') || userData.type === 'premium';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    const sessionCookie = req.cookies.get('sb-access-token')?.value;
    const token = authHeader?.replace('Bearer ', '') || sessionCookie;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user is admin
    if (!(await isAdmin(token))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const environment = url.searchParams.get('environment') || 'production';
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Get feature analytics
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('feature_analytics')
      .select('*')
      .eq('environment', environment)
      .order('feature_type');

    if (analyticsError) {
      console.error('Error fetching analytics:', analyticsError);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // Get total user count
    const { count: totalUsers, error: userCountError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (userCountError) {
      console.error('Error fetching user count:', userCountError);
    }

    // Get premium vs free user breakdown
    const { data: userBreakdown, error: breakdownError } = await supabase
      .from('users')
      .select('type')
      .in('type', ['free', 'premium']);

    if (breakdownError) {
      console.error('Error fetching user breakdown:', breakdownError);
    }

    const userStats = {
      total: totalUsers || 0,
      free: userBreakdown?.filter(u => u.type === 'free').length || 0,
      premium: userBreakdown?.filter(u => u.type === 'premium').length || 0
    };

    // Get recent usage trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    let trendsQuery = supabase
      .from('user_daily_usage')
      .select('usage_date, feature_type, count, success_count, failure_count')
      .eq('environment', environment)
      .gte('usage_date', sevenDaysAgo.toISOString().split('T')[0])
      .order('usage_date', { ascending: false });

    if (startDate) {
      trendsQuery = trendsQuery.gte('usage_date', startDate);
    }
    if (endDate) {
      trendsQuery = trendsQuery.lte('usage_date', endDate);
    }

    const { data: trendsData, error: trendsError } = await trendsQuery;

    if (trendsError) {
      console.error('Error fetching trends:', trendsError);
    }

    // Process trends data
    interface TrendData {
      date: string;
      total_requests: number;
      successful_requests: number;
      failed_requests: number;
      features: Record<string, number>;
    }

    const trendsByDate = trendsData?.reduce((acc, item) => {
      const date = item.usage_date;
      if (!acc[date]) {
        acc[date] = {
          date,
          total_requests: 0,
          successful_requests: 0,
          failed_requests: 0,
          features: {}
        };
      }
      
      acc[date].total_requests += item.count;
      acc[date].successful_requests += item.success_count;
      acc[date].failed_requests += item.failure_count;
      
      if (!acc[date].features[item.feature_type]) {
        acc[date].features[item.feature_type] = 0;
      }
      acc[date].features[item.feature_type] += item.count;
      
      return acc;
    }, {} as Record<string, TrendData>) || {};

    // Get top users by usage (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: topUsersData, error: topUsersError } = await supabase
      .from('user_daily_usage')
      .select(`
        user_id,
        users!inner(email, type),
        count
      `)
      .eq('environment', environment)
      .gte('usage_date', thirtyDaysAgo.toISOString().split('T')[0]);

    if (topUsersError) {
      console.error('Error fetching top users:', topUsersError);
    }

    // Process top users data
    interface TopUser {
      user_id: string;
      email: string;
      type: string;
      total_usage: number;
    }

    const topUsers = topUsersData?.reduce((acc, item) => {
      const userId = item.user_id;
      if (!acc[userId]) {
        acc[userId] = {
          user_id: userId,
          email: (item.users as unknown as { email: string; type: string }).email,
          type: (item.users as unknown as { email: string; type: string }).type,
          total_usage: 0
        };
      }
      acc[userId].total_usage += item.count;
      return acc;
    }, {} as Record<string, TopUser>) || {};

    const topUsersList = Object.values(topUsers)
      .sort((a: TopUser, b: TopUser) => b.total_usage - a.total_usage)
      .slice(0, 10);

    return NextResponse.json({
      analytics: analyticsData || [],
      userStats,
      trends: Object.values(trendsByDate).sort((a: TrendData, b: TrendData) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
      topUsers: topUsersList,
      environment,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in analytics API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 