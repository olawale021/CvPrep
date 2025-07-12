"use client";

import { ChevronDown, Clock, FileText, MessageSquare, RefreshCw, Star, Users, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/auth/supabaseClient";
import { Badge } from "../../ui/base/Badge";
import { Button } from "../../ui/base/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger } from "../../ui/composite/DropdownMenu";
import { ProgressBar } from "../../ui/feedback/ProgressBar";
import { UpgradeContactDialog } from "../../ui/UpgradeContactDialog";

interface UsageStats {
  resume_create: { used: number; limit: number };
  resume_optimize: { used: number; limit: number };
  resume_scoring: { used: number; limit: number };
  cover_letter_create: { used: number; limit: number };
  cover_letter_optimize: { used: number; limit: number };
  personal_statement_create: { used: number; limit: number };
  interview_prep: { used: number; limit: number };
  trialDaysRemaining: number;
  isTrialExpired?: boolean;
  environment?: string;
}

function FeatureUsage({ 
  icon, 
  name, 
  used, 
  limit, 
  isTrialExpired 
}: { 
  icon: React.ReactNode; 
  name: string; 
  used: number; 
  limit: number; 
  isTrialExpired?: boolean;
}) {
  const percentage = limit > 0 ? (used / limit) * 100 : 0;
  const isAtLimit = used >= limit;

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-2">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isTrialExpired ? 'bg-gray-400' : isAtLimit ? 'bg-red-500' : 'bg-blue-500'}`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-700">{name}</span>
      </div>
      <div className="flex items-center space-x-2">
        {isTrialExpired ? (
          <span className="text-sm text-gray-500">Trial used</span>
        ) : (
          <>
            <ProgressBar 
              value={percentage} 
              size="sm"
              variant={isAtLimit ? "error" : "default"}
              className="w-16"
            />
            <span className={`text-sm font-medium ${isAtLimit ? 'text-red-600' : 'text-gray-600'} min-w-[2rem]`}>
              {used}/{limit}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export function UsageTracker() {
  const { appUser, user } = useAuth();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const fetchUsageStats = useCallback(async (isRefresh = false) => {
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
        // Parse error response properly without silent fallback
        let errorMessage = `Error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, use the status-based message
          console.error('Failed to parse error response:', parseError);
        }
        
        setError(errorMessage);
        
        // Set default data if API fails
        setUsage({
          resume_create: { used: 0, limit: 1 },
          resume_optimize: { used: 0, limit: 1 },
          resume_scoring: { used: 0, limit: 1 },
          cover_letter_create: { used: 0, limit: 1 },
          cover_letter_optimize: { used: 0, limit: 1 },
          personal_statement_create: { used: 0, limit: 1 },
          interview_prep: { used: 0, limit: 3 },
          trialDaysRemaining: 3,
          isTrialExpired: false
        });
      }
    } catch (err) {
      console.error('Error fetching usage stats:', err);
      setError('Failed to load usage data');
      
      // Set default data on error
      setUsage({
        resume_create: { used: 0, limit: 1 },
        resume_optimize: { used: 0, limit: 1 },
        resume_scoring: { used: 0, limit: 1 },
        cover_letter_create: { used: 0, limit: 1 },
        cover_letter_optimize: { used: 0, limit: 1 },
        personal_statement_create: { used: 0, limit: 1 },
        interview_prep: { used: 0, limit: 3 },
        trialDaysRemaining: 3,
        isTrialExpired: false
      });
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  }, []);

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
  }, [appUser, user, fetchUsageStats]);

  const handleRefresh = () => {
    fetchUsageStats(true);
  };

  if (!user) {
    return null;
  }

  if (appUser?.type === 'premium') {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
        <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
          <Zap className="w-3 h-3 text-white" />
        </div>
        <span className="text-sm font-medium text-gray-900">Premium Plan</span>
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
          Unlimited
        </Badge>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
        <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
      </div>
    );
  }

  if (error && !usage) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 rounded-lg border border-red-200">
        <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center">
          <RefreshCw className="w-3 h-3 text-red-600" />
        </div>
        <span className="text-sm text-red-600">Error loading usage</span>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          size="sm" 
          variant="outline"
          className="text-xs px-2 py-1 border-red-200 text-red-600 hover:bg-red-100"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!usage) return null;

  // Calculate total usage for summary
  const totalUsed = usage.resume_create.used + usage.resume_optimize.used + usage.resume_scoring.used + 
                   usage.cover_letter_create.used + usage.personal_statement_create.used + usage.interview_prep.used;
  const totalLimit = usage.resume_create.limit + usage.resume_optimize.limit + usage.resume_scoring.limit + 
                    usage.cover_letter_create.limit + usage.personal_statement_create.limit + usage.interview_prep.limit;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className={`flex items-center space-x-2 px-3 py-2 h-auto ${
              usage.isTrialExpired 
                ? 'border-red-200 bg-red-50 hover:bg-red-100' 
                : usage.trialDaysRemaining <= 1 
                  ? 'border-orange-200 bg-orange-50 hover:bg-orange-100' 
                  : 'border-blue-200 bg-blue-50 hover:bg-blue-100'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              usage.isTrialExpired 
                ? 'bg-red-500' 
                : usage.trialDaysRemaining <= 1 
                  ? 'bg-orange-500' 
                  : 'bg-blue-500'
            }`}>
              <Clock className="w-3 h-3 text-white" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-gray-900">
                {usage.isTrialExpired ? "Trial Used" : `${usage.trialDaysRemaining} days left`}
              </span>
              <span className="text-xs text-gray-600">
                {totalUsed}/{totalLimit} used today
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-80 p-0" align="start">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-medium text-gray-900">
                  {usage.isTrialExpired ? "Free Trial Used" : "Free Trial"}
                </h3>
                <p className="text-sm text-gray-600">
                  {usage.isTrialExpired ? "Upgrade to continue" : `${usage.trialDaysRemaining} days remaining`}
                </p>
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
                <Button 
                  size="sm" 
                  className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1"
                  onClick={() => setShowUpgradeDialog(true)}
                >
                  Upgrade
                </Button>
              </div>
            </div>

            {!usage.isTrialExpired && (
              <div className="text-xs text-gray-500 mb-4">
                Limits reset daily at midnight
              </div>
            )}

            {/* Resume Features */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-blue-600" />
                Resume Features
              </h4>
              <div className="space-y-1">
                <FeatureUsage
                  icon={<FileText className="w-3 h-3 text-white" />}
                  name="Resume Creation"
                  used={usage.resume_create.used}
                  limit={usage.resume_create.limit}
                  isTrialExpired={usage.isTrialExpired}
                />
                <FeatureUsage
                  icon={<Zap className="w-3 h-3 text-white" />}
                  name="Resume Optimization"
                  used={usage.resume_optimize.used}
                  limit={usage.resume_optimize.limit}
                  isTrialExpired={usage.isTrialExpired}
                />
                <FeatureUsage
                  icon={<Star className="w-3 h-3 text-white" />}
                  name="Resume Scoring"
                  used={usage.resume_scoring.used}
                  limit={usage.resume_scoring.limit}
                  isTrialExpired={usage.isTrialExpired}
                />
              </div>
            </div>

            <DropdownMenuSeparator />

            {/* Career Features */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                <Users className="w-4 h-4 mr-2 text-green-600" />
                Career Features
              </h4>
              <div className="space-y-1">
                <FeatureUsage
                  icon={<MessageSquare className="w-3 h-3 text-white" />}
                  name="Cover Letter Generation"
                  used={usage.cover_letter_create.used}
                  limit={usage.cover_letter_create.limit}
                  isTrialExpired={usage.isTrialExpired}
                />
                <FeatureUsage
                  icon={<FileText className="w-3 h-3 text-white" />}
                  name="Personal Statement"
                  used={usage.personal_statement_create.used}
                  limit={usage.personal_statement_create.limit}
                  isTrialExpired={usage.isTrialExpired}
                />
                <FeatureUsage
                  icon={<Users className="w-3 h-3 text-white" />}
                  name="Interview Preparation"
                  used={usage.interview_prep.used}
                  limit={usage.interview_prep.limit}
                  isTrialExpired={usage.isTrialExpired}
                />
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <UpgradeContactDialog 
        open={showUpgradeDialog} 
        onCloseAction={() => setShowUpgradeDialog(false)}
        feature="all premium features"
        title="Upgrade to Premium"
        description={usage.isTrialExpired 
          ? "Your free trial has expired. Contact our admin to upgrade and continue using all features!"
          : "Get unlimited access to all features and priority support!"
        }
      />
    </>
  );
}