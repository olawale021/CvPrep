import { NextRequest, NextResponse } from 'next/server';
import { isUserAdmin } from '../../../../lib/auth/adminConfig';
import { getServerUser } from '../../../../lib/auth/supabase-server';
import { supabaseAdmin } from '../../../../lib/auth/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    // Get user using proper SSR authentication
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

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';

    // Build query for users
    let query = supabaseAdmin
      .from('users')
      .select('id, email, type, created_at, updated_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add search filter if provided
    if (search) {
      query = query.ilike('email', `%${search}%`);
    }

    const { data: users, error: usersError } = await query;

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch users',
        details: usersError.message
      }, { status: 500 });
    }

    // Get user count for pagination
    const { count, error: countError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error getting user count:', countError);
    }

    // Return users with empty usage stats (simplified version)
    const enhancedUsers = users?.map(user => ({
      ...user,
      usage: { total: 0, features: {} }
    })) || [];

    return NextResponse.json({
      success: true,
      users: enhancedUsers,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      },
      simplified: true, // Indicate this is the simplified version
      countError: countError?.message || null
    });

  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 