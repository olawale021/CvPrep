import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/auth/supabaseClient';
import { FeatureType } from '../../lib/auth/userRateLimit';

interface UsageData {
  used: number;
  limit: number;
}

interface UsageStats {
  resume_create: UsageData;
  resume_optimize: UsageData;
  resume_scoring: UsageData;
  cover_letter_create: UsageData;
  cover_letter_optimize: UsageData;
  personal_statement_create: UsageData;
  interview_prep: UsageData;
  trialDaysRemaining: number;
  isTrialExpired?: boolean;
}

interface FeatureAccessResult {
  canAccess: boolean;
  isTrialExpired: boolean;
  isAtLimit: boolean;
  remaining: number;
  trialDaysRemaining: number;
  loading: boolean;
  error: string | null;
  checkAccess: () => Promise<boolean>;
}

export function useFeatureAccess(feature: FeatureType): FeatureAccessResult {
  const { appUser, user } = useAuth();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsageStats = async () => {
    try {
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
        throw new Error('Failed to fetch usage data');
      }
    } catch (err) {
      console.error('Error fetching usage stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

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

  const checkAccess = async (): Promise<boolean> => {
    // Premium users always have access
    if (appUser?.type === 'premium') {
      return true;
    }

    // If no user, deny access
    if (!user) {
      return false;
    }

    // If we don't have usage data, fetch it
    if (!usage) {
      await fetchUsageStats();
    }

    // Check current usage after potential refresh
    const currentUsage = usage;
    if (!currentUsage) {
      return false;
    }

    // Check if trial is expired
    if (currentUsage.isTrialExpired) {
      return false;
    }

    // Check if feature limit is exceeded
    const featureUsage = currentUsage[feature];
    if (featureUsage && featureUsage.used >= featureUsage.limit) {
      return false;
    }

    return true;
  };

  // Calculate access status
  const isTrialExpired = usage?.isTrialExpired || false;
  const featureUsage = usage?.[feature];
  const remaining = featureUsage ? featureUsage.limit - featureUsage.used : 0;
  const isAtLimit = featureUsage ? featureUsage.used >= featureUsage.limit : false;
  const trialDaysRemaining = usage?.trialDaysRemaining || 0;

  // Premium users always have access
  if (appUser?.type === 'premium') {
    return {
      canAccess: true,
      isTrialExpired: false,
      isAtLimit: false,
      remaining: 999,
      trialDaysRemaining: 999,
      loading: false,
      error: null,
      checkAccess
    };
  }

  // No user means no access
  if (!user) {
    return {
      canAccess: false,
      isTrialExpired: false,
      isAtLimit: false,
      remaining: 0,
      trialDaysRemaining: 0,
      loading: false,
      error: null,
      checkAccess
    };
  }

  const canAccess = !isTrialExpired && !isAtLimit && !loading;

  return {
    canAccess,
    isTrialExpired,
    isAtLimit,
    remaining,
    trialDaysRemaining,
    loading,
    error,
    checkAccess
  };
} 