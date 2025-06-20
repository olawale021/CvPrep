import { NextRequest, NextResponse } from 'next/server';
import { isAdminEmail } from '../../../../lib/auth/adminConfig';
import { createServerSupabaseClient } from '../../../../lib/auth/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    
    // Get the current user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch simple user data
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, type, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error('Error in users-simple API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 