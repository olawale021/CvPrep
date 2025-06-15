import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { supabase } from './supabaseClient';

// Create a separate client for user authentication verification
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const authClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Feature usage tracking interface
interface FeatureUsage {
  userId: string;
  feature: FeatureType;
  date: string; // YYYY-MM-DD format
  count: number;
  successCount: number;
  failureCount: number;
  resetTime: number;
}

// Usage attempt metadata
interface UsageMetadata {
  success: boolean;
  processingTimeMs?: number;
  errorMessage?: string;
  additionalData?: Record<string, unknown>;
}

// Available features with daily limits
export type FeatureType = 
  | 'resume_create' 
  | 'resume_optimize' 
  | 'cover_letter_create' 
  | 'cover_letter_optimize'
  | 'interview_prep';

// Feature limits for free users
export const FREE_USER_LIMITS = {
  resume_create: 1,      // 1 per day
  resume_optimize: 1,    // 1 per day  
  cover_letter_create: 1, // 1 per day
  cover_letter_optimize: 1, // 1 per day
  interview_prep: 3,     // 3 per day
} as const;

// Trial period in days
export const FREE_TRIAL_DAYS = 7;

// Get current environment
const getCurrentEnvironment = (): 'production' | 'development' => {
  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
};

export class UserFeatureLimiter {
  private async getUserFromRequest(req: NextRequest): Promise<{ id: string; type: string; email: string; created_at: string } | null> {
    try {
      // Extract user ID from Authorization header or cookie
      const authHeader = req.headers.get('Authorization');
      const sessionCookie = req.cookies.get('sb-access-token')?.value;
      
      const token = authHeader?.replace('Bearer ', '') || sessionCookie;
      
      if (!token) {
        return null;
      }

      // Verify the token and get user
      const { data: { user }, error } = await authClient.auth.getUser(token);
      
      if (error || !user) {
        return null;
      }

      // Get user data from your users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, type, email, created_at')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        return null;
      }

      return userData;
    } catch (error) {
      console.error('Error getting user from request:', error);
      return null;
    }
  }

  private isTrialExpired(userCreatedAt: string): boolean {
    const createdDate = new Date(userCreatedAt);
    const expiryDate = new Date(createdDate.getTime() + (FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000));
    return new Date() > expiryDate;
  }

  private async getUserDailyUsage(userId: string, feature: FeatureType): Promise<FeatureUsage | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const environment = getCurrentEnvironment();

      const { data, error } = await supabase
        .from('user_daily_usage')
        .select('user_id, feature_type, usage_date, count')
        .eq('user_id', userId)
        .eq('feature_type', feature)
        .eq('usage_date', today)
        .eq('environment', environment)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching user daily usage:', error);
        return null;
      }

      if (!data) {
        return {
          userId,
          feature,
          date: today,
          count: 0,
          successCount: 0,
          failureCount: 0,
          resetTime: this.getResetTime()
        };
      }

      return {
        userId: data.user_id,
        feature: data.feature_type,
        date: data.usage_date,
        count: data.count || 0,
        successCount: 0, // Default to 0 since column doesn't exist
        failureCount: 0, // Default to 0 since column doesn't exist
        resetTime: this.getResetTime()
      };
    } catch (error) {
      console.error('Error getting user daily usage:', error);
      return null;
    }
  }

  private getResetTime(): number {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  async checkFeatureLimit(req: NextRequest, feature: FeatureType): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    reason?: string;
    requiresUpgrade?: boolean;
  }> {
    const user = await this.getUserFromRequest(req);
    
    if (!user) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: 0,
        reason: 'Authentication required',
        requiresUpgrade: false
      };
    }

    // Premium users have no limits
    if (user.type === 'premium') {
      return {
        allowed: true,
        remaining: 999, // Unlimited
        resetTime: 0
      };
    }

    // Check if free trial has expired
    if (this.isTrialExpired(user.created_at)) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: 0,
        reason: 'Free trial period has expired. Please upgrade to premium to continue using this feature.',
        requiresUpgrade: true
      };
    }

    // Check daily feature limits for free users
    const usage = await this.getUserDailyUsage(user.id, feature);
    if (!usage) {
      // If we can't get usage data, allow but log error
      console.error('Could not retrieve usage data, allowing request');
      return {
        allowed: true,
        remaining: FREE_USER_LIMITS[feature],
        resetTime: this.getResetTime()
      };
    }

    const limit = FREE_USER_LIMITS[feature];

    // Check if limit exceeded
    if (usage.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: usage.resetTime,
        reason: `Daily limit of ${limit} ${feature.replace('_', ' ')} request(s) exceeded. Upgrade to premium for unlimited access.`,
        requiresUpgrade: true
      };
    }

    return {
      allowed: true,
      remaining: limit - usage.count,
      resetTime: usage.resetTime
    };
  }

  async recordFeatureUsage(req: NextRequest, feature: FeatureType, metadata?: UsageMetadata): Promise<void> {
    const user = await this.getUserFromRequest(req);
    
    if (!user) {
      console.error('Cannot record usage: User not found');
      return;
    }

    // Always record usage for analytics, even for premium users
    const today = new Date().toISOString().split('T')[0];
    const environment = getCurrentEnvironment();
    const isSuccess = metadata?.success ?? true; // Default to success if not specified
    const processingTime = metadata?.processingTimeMs ?? 0;

    try {
      // Check if the record exists first
      const { data: existing } = await supabase
        .from('user_daily_usage')
        .select('count, success_count, failure_count, total_processing_time_ms')
        .eq('user_id', user.id)
        .eq('feature_type', feature)
        .eq('usage_date', today)
        .eq('environment', environment)
        .single();

      if (existing) {
        // Update existing record with success/failure tracking
        const newSuccessCount = existing.success_count + (isSuccess ? 1 : 0);
        const newFailureCount = existing.failure_count + (isSuccess ? 0 : 1);
        const newTotalTime = existing.total_processing_time_ms + processingTime;
        const newCount = existing.count + 1;
        
        const { error: updateError } = await supabase
          .from('user_daily_usage')
          .update({
            count: newCount,
            success_count: newSuccessCount,
            failure_count: newFailureCount,
            total_processing_time_ms: newTotalTime,
            avg_processing_time_ms: newCount > 0 ? Math.round(newTotalTime / newCount) : 0
          })
          .eq('user_id', user.id)
          .eq('feature_type', feature)
          .eq('usage_date', today)
          .eq('environment', environment);

        if (updateError) {
          console.error('Error updating user usage:', updateError);
        }
      } else {
        // Insert new record with success/failure tracking
        const { error: insertError } = await supabase
          .from('user_daily_usage')
          .insert({
            user_id: user.id,
            feature_type: feature,
            usage_date: today,
            environment,
            count: 1,
            success_count: isSuccess ? 1 : 0,
            failure_count: isSuccess ? 0 : 1,
            total_processing_time_ms: processingTime,
            avg_processing_time_ms: processingTime
          });

        if (insertError) {
          console.error('Error inserting user usage:', insertError);
        }
      }

      // Update global analytics with success/failure tracking
      await this.updateGlobalAnalytics(feature, isSuccess, processingTime);

    } catch (error) {
      console.error('Error recording feature usage:', error);
    }
  }

  private async updateGlobalAnalytics(feature: FeatureType, isSuccess: boolean = true, processingTime: number = 0): Promise<void> {
    const environment = getCurrentEnvironment();

    try {
      // Use the SQL function for atomic updates
      const { error } = await supabase.rpc('update_feature_analytics', {
        p_feature_type: feature,
        p_environment: environment,
        p_success: isSuccess,
        p_processing_time: processingTime
      });

      if (error) {
        console.error('Error updating analytics via function:', error);
        
        // Fallback to manual update if function fails
        const { data: existing } = await supabase
          .from('feature_analytics')
          .select('total_count, success_count, failure_count, total_processing_time_ms')
          .eq('feature_type', feature)
          .eq('environment', environment)
          .single();

        if (existing) {
          // Update existing record
          const newTotalCount = existing.total_count + 1;
          const newSuccessCount = existing.success_count + (isSuccess ? 1 : 0);
          const newFailureCount = existing.failure_count + (isSuccess ? 0 : 1);
          const newTotalTime = existing.total_processing_time_ms + processingTime;
          
          const { error: updateError } = await supabase
            .from('feature_analytics')
            .update({
              total_count: newTotalCount,
              success_count: newSuccessCount,
              failure_count: newFailureCount,
              total_processing_time_ms: newTotalTime,
              avg_processing_time_ms: newTotalCount > 0 ? Math.round(newTotalTime / newTotalCount) : 0,
              last_updated: new Date().toISOString()
            })
            .eq('feature_type', feature)
            .eq('environment', environment);

          if (updateError) {
            console.error('Error updating analytics fallback:', updateError);
          }
        } else {
          // Insert new record
          const { error: insertError } = await supabase
            .from('feature_analytics')
            .insert({
              feature_type: feature,
              environment,
              total_count: 1,
              success_count: isSuccess ? 1 : 0,
              failure_count: isSuccess ? 0 : 1,
              total_processing_time_ms: processingTime,
              avg_processing_time_ms: processingTime,
              last_updated: new Date().toISOString(),
              created_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('Error inserting analytics fallback:', insertError);
          }
        }
      }
    } catch (error) {
      console.error('Error updating global analytics:', error);
    }
  }

  createFeatureMiddleware(feature: FeatureType) {
    return async (req: NextRequest) => {
      const result = await this.checkFeatureLimit(req, feature);
      
      if (!result.allowed) {
        const statusCode = result.requiresUpgrade ? 402 : 429; // 402 Payment Required for upgrades
        
        return new Response(
          JSON.stringify({
            error: result.requiresUpgrade ? 'Upgrade Required' : 'Feature Limit Exceeded',
            message: result.reason,
            feature,
            remaining: result.remaining,
            resetTime: result.resetTime,
            requiresUpgrade: result.requiresUpgrade,
            upgradeUrl: '/upgrade'
          }),
          {
            status: statusCode,
            headers: {
              'Content-Type': 'application/json',
              'X-Feature-Limit': FREE_USER_LIMITS[feature].toString(),
              'X-Feature-Remaining': result.remaining.toString(),
              'X-Feature-Reset': result.resetTime.toString(),
            }
          }
        );
      }

      return null; // Allow the request to proceed
    };
  }
}

// Create feature-specific limiters
export const featureLimiters = {
  resumeCreate: new UserFeatureLimiter(),
  resumeOptimize: new UserFeatureLimiter(), 
  coverLetterCreate: new UserFeatureLimiter(),
  coverLetterOptimize: new UserFeatureLimiter(),
  interviewPrep: new UserFeatureLimiter()
};

// Helper function to apply feature limiting to API routes
export async function withFeatureLimit(
  req: NextRequest,
  feature: FeatureType,
  handler: () => Promise<Response>
): Promise<Response> {
  const startTime = Date.now();
  const limiter = new UserFeatureLimiter();
  
  // Check feature limit
  const featureCheck = await limiter.createFeatureMiddleware(feature)(req);
  
  if (featureCheck) {
    // Record failed attempt
    await limiter.recordFeatureUsage(req, feature, {
      success: false,
      processingTimeMs: Date.now() - startTime,
      errorMessage: 'Feature limit exceeded'
    });
    return featureCheck;
  }
  
  let response: Response;
  let success = false;
  let errorMessage = '';
  
  try {
    // Execute the handler
    response = await handler();
    success = response.status >= 200 && response.status < 300;
    
    if (!success) {
      errorMessage = `HTTP ${response.status}`;
    }
  } catch (error) {
    success = false;
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Return error response
    response = new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Record usage
  await limiter.recordFeatureUsage(req, feature, {
    success,
    processingTimeMs: Date.now() - startTime,
    errorMessage: success ? undefined : errorMessage
  });
  
  return response;
}

// Create SQL function for atomic analytics updates
export const createAnalyticsFunction = `
CREATE OR REPLACE FUNCTION update_feature_analytics(
  p_feature_type VARCHAR(50),
  p_environment VARCHAR(20),
  p_success BOOLEAN,
  p_processing_time BIGINT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO feature_analytics (
    feature_type, 
    environment, 
    total_count, 
    success_count, 
    failure_count, 
    total_processing_time_ms,
    avg_processing_time_ms,
    last_updated
  ) VALUES (
    p_feature_type, 
    p_environment, 
    1, 
    CASE WHEN p_success THEN 1 ELSE 0 END,
    CASE WHEN p_success THEN 0 ELSE 1 END,
    p_processing_time,
    p_processing_time,
    NOW()
  )
  ON CONFLICT (feature_type, environment) 
  DO UPDATE SET
    total_count = feature_analytics.total_count + 1,
    success_count = feature_analytics.success_count + (CASE WHEN p_success THEN 1 ELSE 0 END),
    failure_count = feature_analytics.failure_count + (CASE WHEN p_success THEN 0 ELSE 1 END),
    total_processing_time_ms = feature_analytics.total_processing_time_ms + p_processing_time,
    avg_processing_time_ms = CASE 
      WHEN feature_analytics.total_count + 1 > 0 
      THEN (feature_analytics.total_processing_time_ms + p_processing_time) / (feature_analytics.total_count + 1)
      ELSE p_processing_time 
    END,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;
`;