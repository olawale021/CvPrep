"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { isAdminEmail } from "../../lib/auth/adminConfig";
import { Badge } from "../ui/base/Badge";
import { Button } from "../ui/base/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/base/Card";
import { ProgressBar } from "../ui/feedback/ProgressBar";

interface AnalyticsData {
  feature_type: string;
  environment: string;
  total_count: number;
  success_count: number;
  failure_count: number;
  avg_processing_time_ms: number;
  last_updated: string;
}

interface UserStats {
  total: number;
  free: number;
  premium: number;
}

interface DailyTrend {
  date: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  features: Record<string, number>;
}

interface TopUser {
  user_id: string;
  email: string;
  type: string;
  total_usage: number;
}

interface DashboardData {
  analytics: AnalyticsData[];
  userStats: UserStats;
  trends: DailyTrend[];
  topUsers: TopUser[];
  environment: string;
  generatedAt: string;
}

export function AnalyticsDashboard() {
  const { appUser } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [environment, setEnvironment] = useState<'production' | 'development'>('production');

  // Check if user is admin
  const isAdmin = isAdminEmail(appUser?.email);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?environment=${environment}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('Access denied. Admin privileges required.');
        } else {
          setError('Failed to fetch analytics data');
        }
        return;
      }

      const analyticsData = await response.json();
      setData(analyticsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [environment]);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [isAdmin, fetchAnalytics]);

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">Admin privileges required to view analytics.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <div className="animate-pulse h-10 w-32 bg-gray-200 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchAnalytics}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const totalRequests = data.analytics.reduce((sum, item) => sum + item.total_count, 0);
  const totalSuccessful = data.analytics.reduce((sum, item) => sum + item.success_count, 0);
  const totalFailed = data.analytics.reduce((sum, item) => sum + item.failure_count, 0);
  const successRate = totalRequests > 0 ? ((totalSuccessful / totalRequests) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">
            Environment: <Badge variant={environment === 'production' ? 'default' : 'secondary'}>
              {environment}
            </Badge>
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={environment === 'production' ? 'default' : 'outline'}
            onClick={() => setEnvironment('production')}
            size="sm"
          >
            Production
          </Button>
          <Button
            variant={environment === 'development' ? 'default' : 'outline'}
            onClick={() => setEnvironment('development')}
            size="sm"
          >
            Development
          </Button>
          
          <Button onClick={fetchAnalytics} size="sm" variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={data.userStats.total.toLocaleString()}
          subtitle={`${data.userStats.free} free, ${data.userStats.premium} premium`}
          icon="👥"
        />
        
        <StatsCard
          title="Total Requests"
          value={totalRequests.toLocaleString()}
          subtitle="All time"
          icon="📊"
        />
        
        <StatsCard
          title="Success Rate"
          value={`${successRate}%`}
          subtitle={`${totalSuccessful} successful, ${totalFailed} failed`}
          icon="✅"
        />
        
        <StatsCard
          title="Last Updated"
          value={new Date(data.generatedAt).toLocaleTimeString()}
          subtitle={new Date(data.generatedAt).toLocaleDateString()}
          icon="🕐"
        />
      </div>

      {/* Feature Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Usage Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.analytics.map((feature) => (
              <FeatureAnalyticsRow key={feature.feature_type} feature={feature} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Usage Trends (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.trends.slice(0, 7).map((trend) => (
              <DailyTrendRow key={trend.date} trend={trend} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Users */}
      <Card>
        <CardHeader>
          <CardTitle>Top Users (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.topUsers.map((user, index) => (
              <TopUserRow key={user.user_id} user={user} rank={index + 1} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCard({ title, value, subtitle, icon }: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
          <div className="text-2xl">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureAnalyticsRow({ feature }: { feature: AnalyticsData }) {
  const successRate = feature.total_count > 0 
    ? ((feature.success_count / feature.total_count) * 100).toFixed(1)
    : '0';
    
  const avgTime = feature.avg_processing_time_ms 
    ? `${(feature.avg_processing_time_ms / 1000).toFixed(2)}s`
    : 'N/A';

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900 capitalize">
          {feature.feature_type.replace('_', ' ')}
        </h4>
        <Badge variant="secondary">{feature.total_count} total</Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Successful</p>
          <p className="font-medium text-green-600">{feature.success_count}</p>
        </div>
        <div>
          <p className="text-gray-600">Failed</p>
          <p className="font-medium text-red-600">{feature.failure_count}</p>
        </div>
        <div>
          <p className="text-gray-600">Success Rate</p>
          <p className="font-medium">{successRate}%</p>
        </div>
        <div>
          <p className="text-gray-600">Avg Time</p>
          <p className="font-medium">{avgTime}</p>
        </div>
      </div>
      
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Success Rate</span>
          <span>{successRate}%</span>
        </div>
        <ProgressBar value={parseFloat(successRate)} className="h-2" />
      </div>
    </div>
  );
}

function DailyTrendRow({ trend }: { trend: DailyTrend }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">
          {new Date(trend.date).toLocaleDateString()}
        </h4>
        <Badge variant="outline">{trend.total_requests} requests</Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
        <div>
          <p className="text-gray-600">Total</p>
          <p className="font-medium">{trend.total_requests}</p>
        </div>
        <div>
          <p className="text-gray-600">Successful</p>
          <p className="font-medium text-green-600">{trend.successful_requests}</p>
        </div>
        <div>
          <p className="text-gray-600">Failed</p>
          <p className="font-medium text-red-600">{trend.failed_requests}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {Object.entries(trend.features).map(([feature, count]) => (
          <Badge key={feature} variant="secondary" className="text-xs">
            {feature.replace('_', ' ')}: {count}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function TopUserRow({ user, rank }: { user: TopUser; rank: number }) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium">
          {rank}
        </div>
        <div>
          <p className="font-medium text-gray-900">{user.email}</p>
          <p className="text-sm text-gray-600">{user.total_usage} requests</p>
        </div>
      </div>
      
      <Badge variant={user.type === 'premium' ? 'default' : 'secondary'}>
        {user.type}
      </Badge>
    </div>
  );
} 