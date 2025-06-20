import { NextRequest, NextResponse } from 'next/server';
import { isUserAdmin } from '../../../lib/auth/adminConfig';
import { getServerUser } from '../../../lib/auth/supabase-server';
import { supabaseAdmin } from '../../../lib/auth/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      type, 
      priority, 
      title, 
      description, 
      userAgent, 
      url, 
      userId, 
      userEmail 
    } = body;

    // Validate required fields
    if (!type || !priority || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Service configuration error' 
      }, { status: 500 });
    }

    // Prepare feedback data for insertion
    const feedbackData = {
      type,
      priority,
      title: title.trim(),
      description: description.trim(),
      user_agent: userAgent,
      url,
      user_id: userId || null,
      user_email: userEmail || null,
      status: 'new',
      created_at: new Date().toISOString(),
    };

    // Insert feedback into Supabase
    const { data, error } = await supabaseAdmin
      .from('feedback')
      .insert([feedbackData])
      .select();

    if (error) {
      console.error('Error inserting feedback:', error);
      return NextResponse.json(
        { error: 'Failed to save feedback' }, 
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Feedback submitted successfully', 
        id: data[0]?.id 
      }, 
      { status: 201 }
    );

  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Require admin authentication to view feedback
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

    // Use centralized admin check
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'new';
    const limit = parseInt(searchParams.get('limit') || '50');

    const { data, error } = await supabaseAdmin
      .from('feedback')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching feedback:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feedback' }, 
        { status: 500 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Feedback GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 