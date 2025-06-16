"use client";

import { Clock, FileText, MessageSquare, RefreshCw, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/auth/supabaseClient";
import { Badge } from "./base/Badge";
import { Button } from "./base/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./base/Card";
import { ProgressBar } from "./feedback/ProgressBar";

interface UsageStats {
  resume_create: { used: number; limit: number };
  resume_optimize: { used: number; limit: number };
  cover_letter_create: { used: number; limit: number };
  cover_letter_optimize: { used: number; limit: number };
  interview_prep: { used: number; limit: number };
  trialDaysRemaining: number;
  environment?: string;
}

const featureConfig = {
  resume_create: {
    label: "Resume Create",
    icon: FileText,
    color: "bg-blue-500"
  },
  resume_optimize: {
    label: "Resume Optimize", 
    icon: Zap,
    color: "bg-green-500"
  },
  cover_letter_create: {
    label: "Cover Letter Create",
    icon: MessageSquare,
    color: "bg-purple-500"
  },
  interview_prep: {
    label: "Interview Prep",
    icon: Users,
    color: "bg-indigo-500"
  }
} as const;

export function UsageTracker() {
  const { appUser, user } = useAuth();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (appUser?.type === 'premium') {
      setLoading(false);
      return;
    }

    fetchUsageStats();
  }, [appUser, user]);

  const fetchUsageStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      setError(null);
      
      // Get the session token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/user/usage', { headers });
      
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load usage data' }));
        setError(errorData.error || `Error ${response.status}`);
        
        // Set default data if API fails
        setUsage({
          resume_create: { used: 0, limit: 1 },
          resume_optimize: { used: 0, limit: 1 },
          cover_letter_create: { used: 0, limit: 1 },
          cover_letter_optimize: { used: 0, limit: 1 },
          interview_prep: { used: 0, limit: 3 },
          trialDaysRemaining: 7
        });
      }
    } catch (err) {
      console.error('Error fetching usage stats:', err);
      setError('Failed to load usage data');
      
      // Set default data on error
      setUsage({
        resume_create: { used: 0, limit: 1 },
        resume_optimize: { used: 0, limit: 1 },
        cover_letter_create: { used: 0, limit: 1 },
        cover_letter_optimize: { used: 0, limit: 1 },
        interview_prep: { used: 0, limit: 3 },
        trialDaysRemaining: 7
      });
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  const handleRefresh = () => {
    fetchUsageStats(true);
  };

  if (!user) {
    return null;
  }

  if (appUser?.type === 'premium') {
    return (
      <Card className="border-0 shadow-sm bg-gradient-to-r from-yellow-50 to-amber-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Premium Plan</h3>
                <p className="text-xs text-gray-600">Unlimited access</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Premium
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="flex space-x-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex-1 text-center">
                  <div className="w-8 h-8 bg-gray-200 rounded mx-auto mb-2"></div>
                  <div className="h-2 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-8 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !usage) {
    return (
      <Card className="border-0 shadow-sm border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-red-600 text-sm mb-2">{error}</p>
            <Button 
              onClick={handleRefresh} 
              disabled={refreshing}
              size="sm" 
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-100"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!usage) return null;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-medium text-gray-900">Free Trial</CardTitle>
              <p className="text-xs text-gray-600">{usage.trialDaysRemaining} days remaining</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              onClick={handleRefresh}
              disabled={refreshing}
              size="sm" 
              variant="outline"
              className="text-xs px-2 py-1"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1">
              Upgrade
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex space-x-4">
          {Object.entries(usage)
            .filter(([key]) => key !== 'trialDaysRemaining' && key !== 'environment' && key in featureConfig)
            .map(([key, value]) => {
            const featureKey = key as keyof typeof featureConfig;
            const config = featureConfig[featureKey];
            
            const { used, limit } = value;
            const percentage = limit > 0 ? (used / limit) * 100 : 0;
            const isAtLimit = used >= limit;
            
            const Icon = config.icon;
            
            return (
              <div key={key} className="flex-1 text-center">
                <div className="mb-2">
                  <div className={`w-8 h-8 ${isAtLimit ? 'bg-red-500' : config.color} rounded-lg flex items-center justify-center mx-auto mb-1`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-medium text-gray-700 mb-1">{config.label}</p>
                </div>
                
                <div className="space-y-1">
                  <ProgressBar 
                    value={percentage} 
                    size="sm"
                    variant={isAtLimit ? "error" : "default"}
                  />
                  <div className="flex justify-center">
                    <span className={`text-xs font-medium ${isAtLimit ? 'text-red-600' : 'text-gray-600'}`}>
                      {used}/{limit}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Limits reset daily at midnight. <span className="text-blue-600 cursor-pointer hover:underline">Upgrade for unlimited access.</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}