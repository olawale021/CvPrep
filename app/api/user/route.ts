import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/auth/supabaseClient';
import logger from '../../../lib/core/logger';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, email, name, image, googleId, type } = body;
    if (!id || !email) {
      logger.warn('Invalid user data for database save', {
        context: 'UserAPI',
      });
      return NextResponse.json({ error: 'Invalid user data' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      logger.error('Supabase admin client not available', {
        context: 'UserAPI',
      });
      return NextResponse.json({ error: 'Service configuration error' }, { status: 500 });
    }

    // Check if user already exists using admin client
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('type')
      .eq('email', email)
      .single();

    let userType = "free";
    if (existingUser && existingUser.type) {
      userType = existingUser.type; // preserve existing type
    } else if (type) {
      userType = type; // use provided type if any
    }

    // Prepare user data for upsert
    const userData = {
      id,
      google_id: googleId || id,
      oauth_id: googleId || id,
      email,
      full_name: name || email,
      profile_picture: image || null,
      auth_provider: 'google',
      password_hash: null,
      is_active: true,
      is_verified: true,
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
      type: userType, // <-- use the determined type
    };

    // Upsert the user by email using admin client to bypass RLS
    const { error } = await supabaseAdmin
      .from('users')
      .upsert([userData], { onConflict: 'email' });
    if (error) {
      logger.error('Database save error', {
        error: error.message,
        context: 'UserAPI',
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    logger.info('User data saved successfully', {
      email,
      context: 'UserAPI',
    });
    return NextResponse.json({ success: true, userId: id });
  } catch (err) {
    logger.error('Unexpected API error', {
      error: err,
      context: 'UserAPI',
    });
    return NextResponse.json({
      error: 'Server error',
      message: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  if (!supabaseAdmin) {
    logger.error('Supabase admin client not available', {
      context: 'UserAPI',
    });
    return NextResponse.json({ error: 'Service configuration error' }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", email)
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ user: data });
} 