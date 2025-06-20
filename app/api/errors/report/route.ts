import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '../../../../lib/auth/supabase-server';
import { supabaseAdmin } from '../../../../lib/auth/supabaseClient';

interface ErrorReport {
  message: string;
  stack?: string;
  name?: string;
  cause?: unknown;
  context: {
    userId?: string;
    userEmail?: string;
    url?: string;
    userAgent?: string;
    timestamp?: string;
    sessionId?: string;
    buildId?: string;
    environment?: string;
    [key: string]: unknown;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'api' | 'ui' | 'auth' | 'payment' | 'ai' | 'upload' | 'general';
  fingerprint?: string;
}

export async function POST(req: NextRequest) {
  try {
    const errorReport: ErrorReport = await req.json();

    // Validate the error report
    if (!errorReport.message || !errorReport.context) {
      return NextResponse.json(
        { error: 'Invalid error report format' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Service configuration error' 
      }, { status: 500 });
    }

    // Get client IP for additional context
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';

    // Store error report in database
    const { error: dbError } = await supabaseAdmin
      .from('error_reports')
      .insert({
        message: errorReport.message,
        stack: errorReport.stack,
        name: errorReport.name,
        cause: errorReport.cause,
        context: {
          ...errorReport.context,
          clientIP,
          reportedAt: new Date().toISOString()
        },
        severity: errorReport.severity,
        category: errorReport.category,
        fingerprint: errorReport.fingerprint,
        user_id: errorReport.context.userId || null,
        created_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Failed to store error report:', dbError);
      // Don't return error to client to avoid infinite loops
    }

    // For critical errors, send immediate notifications
    if (errorReport.severity === 'critical') {
      await sendCriticalErrorNotification(errorReport, clientIP);
    }

    // Log error for server-side monitoring
    console.error('Error Report Received:', {
      message: errorReport.message,
      severity: errorReport.severity,
      category: errorReport.category,
      userId: errorReport.context.userId,
      url: errorReport.context.url,
      fingerprint: errorReport.fingerprint
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing error report:', error);
    
    // Return success to avoid infinite error loops
    return NextResponse.json({ success: true });
  }
}

async function sendCriticalErrorNotification(
  errorReport: ErrorReport, 
  clientIP: string
): Promise<void> {
  try {
    // Here you can integrate with notification services
    // Examples: Slack, Discord, Email, SMS, etc.
    
    const notification = {
      title: '🚨 Critical Error in CvPrep',
      message: `**Error:** ${errorReport.message}\n` +
               `**Category:** ${errorReport.category}\n` +
               `**User:** ${errorReport.context.userEmail || 'Anonymous'}\n` +
               `**URL:** ${errorReport.context.url}\n` +
               `**Time:** ${errorReport.context.timestamp}\n` +
               `**IP:** ${clientIP}`,
      severity: 'critical'
    };

    // Example: Send to Slack webhook
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: notification.title,
          attachments: [{
            color: 'danger',
            text: notification.message,
            ts: Math.floor(Date.now() / 1000)
          }]
        })
      });
    }

    // Example: Send email notification
    if (process.env.ADMIN_EMAIL && process.env.SENDGRID_API_KEY) {
      // Integrate with SendGrid or other email service
      // Implementation depends on your email service
    }

  } catch (error) {
    console.error('Failed to send critical error notification:', error);
  }
}

// GET endpoint to retrieve error reports (for admin dashboard)
export async function GET(req: NextRequest) {
  try {
    // Require admin authentication to view error reports
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

    // Check if user is admin (for GET requests)
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('type')
      .eq('id', user.id)
      .single();

    // Admin check: database type is 'admin', email contains 'admin', or specific admin email
    // Allow admin access even if user is not in database yet (for email-based admin check)
    const isAdminByType = userData?.type === 'admin';
    const isAdminByEmail = user.email?.includes('admin') || user.email === 'olawalefilani112@gmail.com';
    const isAdmin = isAdminByType || isAdminByEmail;

    // Only require userData to exist if we're checking database-based admin status
    // Allow email-based admin access even without database record
    if (!isAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const severity = searchParams.get('severity');
    const category = searchParams.get('category');
    const userId = searchParams.get('userId');

    let query = supabaseAdmin
      .from('error_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    // Apply filters
    if (severity) {
      query = query.eq('severity', severity);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: reports, error } = await query;

    if (error) {
      throw error;
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('error_reports')
      .select('*', { count: 'exact', head: true });

    if (severity) countQuery = countQuery.eq('severity', severity);
    if (category) countQuery = countQuery.eq('category', category);
    if (userId) countQuery = countQuery.eq('user_id', userId);

    const { count } = await countQuery;

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching error reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch error reports' },
      { status: 500 }
    );
  }
} 