"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/auth/supabaseClient";
import { Badge } from "../../ui/base/Badge";

interface CompactUsageStats {
  totalUsed: number;
  totalLimit: number;
  trialDaysRemaining: number;
  isTrialExpired: boolean;
}

export function UsageBadge() {
  const { appUser } = useAuth();
  const [usage, setUsage] = useState<CompactUsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser) {
      setLoading(false);
      return;
    }

    if (appUser.type === 'premium') {
      setLoading(false);
      return;
    }

    fetchUsageStats();
  }, [appUser]);

  const fetchUsageStats = async () => {
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
        
        // Calculate totals
        const totalUsed = (data.resume_create?.used || 0) + 
                         (data.resume_optimize?.used || 0) + 
                         (data.cover_letter_create?.used || 0) + 
                         (data.cover_letter_optimize?.used || 0) + 
                         (data.interview_prep?.used || 0);
                         
        const totalLimit = (data.resume_create?.limit || 0) + 
                          (data.resume_optimize?.limit || 0) + 
                          (data.cover_letter_create?.limit || 0) + 
                          (data.cover_letter_optimize?.limit || 0) + 
                          (data.interview_prep?.limit || 0);

        setUsage({
          totalUsed,
          totalLimit,
          trialDaysRemaining: data.trialDaysRemaining || 0,
          isTrialExpired: data.trialDaysRemaining <= 0
        });
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !appUser) {
    return (
      <div className="animate-pulse">
        <div className="h-6 w-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (appUser.type === 'premium') {
    return (
      <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-200">
        ✨ Premium
      </Badge>
    );
  }

  if (!usage) return null;

  const { totalUsed, totalLimit, trialDaysRemaining, isTrialExpired } = usage;
  const usagePercentage = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

  if (isTrialExpired) {
    return (
      <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
        ⏰ Trial Expired
      </Badge>
    );
  }

  if (trialDaysRemaining <= 2) {
    return (
      <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
        ⚠️ {trialDaysRemaining}d left
      </Badge>
    );
  }

  if (usagePercentage >= 80) {
    return (
      <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
        🔥 {totalUsed}/{totalLimit}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
      📊 {totalUsed}/{totalLimit}
    </Badge>
  );
} 