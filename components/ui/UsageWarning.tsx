"use client";

import { AlertTriangle, Clock, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/auth/supabaseClient";
import { FeatureType } from "../../lib/auth/userRateLimit";
import { Alert } from "./base/Alert";
import { Badge } from "./base/Badge";
import { Button } from "./base/Button";
import { UpgradeContactDialog } from "./UpgradeContactDialog";

interface FeatureUsageData {
  used: number;
  limit: number;
  successful: number;
  failed: number;
}

interface UsageWarningProps {
  feature: FeatureType;
  showOnZeroRemaining?: boolean;
  showTrialWarning?: boolean;
  className?: string;
}

export function UsageWarning({ 
  feature, 
  showOnZeroRemaining = true, 
  showTrialWarning = true,
  className = ""
}: UsageWarningProps) {
  const [usage, setUsage] = useState<FeatureUsageData | null>(null);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const { appUser } = useAuth();

  const fetchUsageData = useCallback(async () => {
    try {
      // Get the session token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/user/usage', { headers });
      if (response.ok) {
        const data = await response.json();
        setUsage(data[feature] || { used: 0, limit: 1, successful: 0, failed: 0 });
        setTrialDaysRemaining(data.trialDaysRemaining || 0);
      }
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  }, [feature]);

  useEffect(() => {
    if (!appUser) {
      setLoading(false);
      return;
    }

    if (appUser.type === 'premium') {
      setLoading(false);
      return;
    }

    fetchUsageData();
  }, [appUser, fetchUsageData]);

  if (loading || !appUser) {
    return null;
  }

  if (appUser.type === 'premium') {
    return null;
  }

  if (!usage) {
    return null;
  }

  const remaining = usage.limit - usage.used;
  const isTrialExpired = trialDaysRemaining <= 0;
  const isTrialExpiring = trialDaysRemaining <= 2 && trialDaysRemaining > 0;
  const isAtLimit = remaining <= 0;
  const isNearLimit = remaining === 1 && usage.limit > 1;

  // Show trial expired warning
  if (isTrialExpired) {
    return (
      <>
        <Alert className={`border-red-200 bg-red-50 ${className}`}>
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <div className="flex-1">
            <h4 className="text-red-800 font-semibold">Free Trial Expired</h4>
            <p className="text-red-700 text-sm mt-1">
              Your 3-day free trial has ended. Upgrade to premium to continue using AI-powered features.
            </p>
            <div className="mt-3">
              <Button 
                className="bg-slate-800 hover:bg-slate-700 text-white"
                onClick={() => setShowUpgradeDialog(true)}
              >
                Upgrade Now
              </Button>
            </div>
          </div>
        </Alert>
        
        <UpgradeContactDialog 
          open={showUpgradeDialog} 
          onCloseAction={() => setShowUpgradeDialog(false)}
          feature="all premium features"
          title="Upgrade to Premium"
          description="Your free trial has expired. Contact our admin to upgrade and continue using all features!"
        />
      </>
    );
  }

  // Show limit exceeded warning
  if (isAtLimit && showOnZeroRemaining) {
    return (
      <>
        <Alert className={`border-orange-200 bg-orange-50 ${className}`}>
          <Zap className="h-4 w-4 text-orange-600" />
          <div className="flex-1">
            <h4 className="text-orange-800 font-semibold">Daily Limit Reached</h4>
            <p className="text-orange-700 text-sm mt-1">
              You&lsquo;ve used all {usage.limit} {getFeatureDisplayName(feature)} requests today. 
              Limits reset at midnight or upgrade for unlimited access.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                <Clock className="h-4 w-4 mr-1" />
                Resets at Midnight
              </Button>
              <Button 
                className="bg-slate-800 hover:bg-slate-700 text-white"
                onClick={() => setShowUpgradeDialog(true)}
              >
                Upgrade Now
              </Button>
            </div>
          </div>
        </Alert>
        
        <UpgradeContactDialog 
          open={showUpgradeDialog} 
          onCloseAction={() => setShowUpgradeDialog(false)}
          feature={getFeatureDisplayName(feature)}
          title="Upgrade to Premium"
          description={`You've reached your daily limit for ${getFeatureDisplayName(feature)}. Upgrade to premium for unlimited access!`}
        />
      </>
    );
  }

  // Show near limit warning
  if (isNearLimit) {
    return (
      <>
        <Alert className={`border-yellow-200 bg-yellow-50 ${className}`}>
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-yellow-800 font-semibold">Almost at Daily Limit</h4>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                {remaining} left today
              </Badge>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              You have {remaining} {getFeatureDisplayName(feature)} request remaining today. 
              Consider upgrading for unlimited access.
            </p>
            <div className="mt-3">
              <Button 
                variant="outline" 
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                onClick={() => setShowUpgradeDialog(true)}
              >
                View Premium Plans
              </Button>
            </div>
          </div>
        </Alert>
        
        <UpgradeContactDialog 
          open={showUpgradeDialog} 
          onCloseAction={() => setShowUpgradeDialog(false)}
          feature={getFeatureDisplayName(feature)}
          title="Upgrade to Premium"
          description={`You're almost at your daily limit for ${getFeatureDisplayName(feature)}. Upgrade to premium for unlimited access!`}
        />
      </>
    );
  }

  // Show trial expiring warning
  if (isTrialExpiring && showTrialWarning) {
    return (
      <>
        <Alert className={`border-blue-200 bg-blue-50 ${className}`}>
          <Clock className="h-4 w-4 text-blue-600" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-blue-800 font-semibold">Trial Ending Soon</h4>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {trialDaysRemaining} day{trialDaysRemaining === 1 ? '' : 's'} left
              </Badge>
            </div>
            <p className="text-blue-700 text-sm mt-1">
              Your free trial ends in {trialDaysRemaining} day{trialDaysRemaining === 1 ? '' : 's'}. 
              Upgrade now to continue using all features without limits.
            </p>
            <div className="mt-3">
              <Button 
                className="bg-slate-800 hover:bg-slate-700 text-white"
                onClick={() => setShowUpgradeDialog(true)}
              >
                Upgrade Before Trial Ends
              </Button>
            </div>
          </div>
        </Alert>
        
        <UpgradeContactDialog 
          open={showUpgradeDialog} 
          onCloseAction={() => setShowUpgradeDialog(false)}
          feature="all premium features"
          title="Upgrade to Premium"
          description={`Your free trial ends in ${trialDaysRemaining} day${trialDaysRemaining === 1 ? '' : 's'}. Contact our admin to upgrade and continue using all features!`}
        />
      </>
    );
  }

  return null;
}

function getFeatureDisplayName(feature: FeatureType): string {
  const names = {
    resume_create: 'resume creation',
    resume_optimize: 'resume optimization',
    resume_scoring: 'resume scoring',
    cover_letter_create: 'cover letter creation',
    cover_letter_optimize: 'cover letter optimization',
    personal_statement_create: 'personal statement creation',
    interview_prep: 'interview preparation'
  };
  return names[feature] || feature;
} 