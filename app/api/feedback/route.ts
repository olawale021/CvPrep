import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

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
    const { data, error } = await supabase
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
    // Only allow admin users to view feedback (you can implement admin check)
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'new';
    const limit = parseInt(searchParams.get('limit') || '50');

    const { data, error } = await supabase
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