import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import logger from '../../../lib/logger';
import { supabase } from '../../../lib/supabaseClient';
import { oauthIdToUuid } from '../../../lib/utils';
import { authOptions } from '../auth/[...nextauth]/options';

/**
 * Check if a user with the given email already exists in the database
 */
async function checkUserExists(email: string): Promise<boolean> {
  try {
    logger.debug('Server-side checking user existence', { 
      email,
      context: 'UserAPI'
    });
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);
      
    if (error) {
      logger.error('User existence check failed', { 
        error: error.message,
        context: 'UserAPI'
      });
      return false;
    }
    
    const exists = !!data && data.length > 0;
    logger.debug('User existence check complete', { 
      exists,
      recordCount: data?.length || 0,
      context: 'UserAPI'
    });
    return exists;
  } catch (err) {
    logger.error('Unexpected error in user existence check', {
      error: err,
      context: 'UserAPI'
    });
    return false;
  }
}

export async function POST() {
  try {
    // Enforce authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      logger.warn('Unauthorized attempt to save user data', {
        context: 'UserAPI'
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, email, name, image } = session.user;
    
    if (!id || !email) {
      logger.warn('Invalid user data for database save', {
        context: 'UserAPI'
      });
      return NextResponse.json({ error: 'Invalid user data' }, { status: 400 });
    }
    
    // First check if user already exists
    const userExists = await checkUserExists(email);
    
    if (userExists) {
      logger.debug('Skipping save for existing user', {
        email,
        context: 'UserAPI'
      });
      return NextResponse.json({ success: true, skipped: true });
    }
    
    // Convert OAuth ID to UUID format
    const dbUserId = oauthIdToUuid(id);
    logger.debug('Saving user data', {
      email,
      context: 'UserAPI'
    });
    
    // Prepare user data for save
    const userData = {
      id: dbUserId,
      google_id: id,
      email,
      full_name: name || email,
      profile_picture: image || null,
      auth_provider: "google",
      is_active: true,
      is_verified: true,
      last_login: new Date().toISOString(),
    };
    
    // Attempt to save user to Supabase
    const { error } = await supabase.from("users").upsert(
      userData,
      { 
        onConflict: "id",
        ignoreDuplicates: false
      }
    );
    
    if (error) {
      logger.error('Database save error', {
        error: error.message,
        code: error.code,
        details: error.details,
        context: 'UserAPI'
      });
      
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        code: error.code
      }, { status: 500 });
    }
    
    logger.info('User data saved successfully', {
      email,
      context: 'UserAPI'
    });
    return NextResponse.json({ success: true, userId: dbUserId });
    
  } catch (err) {
    logger.error('Unexpected API error', {
      error: err,
      context: 'UserAPI'
    });
    return NextResponse.json({ 
      error: "Server error", 
      message: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Enforce authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = session.user;
    
    // Convert OAuth ID to UUID format
    const dbUserId = oauthIdToUuid(id);
    logger.debug('Fetching user data', {
      context: 'UserAPI'
    });
    
    // Retrieve user from Supabase
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', dbUserId)
      .single();
    
    if (error) {
      logger.error('Error fetching user', {
        error: error.message,
        context: 'UserAPI'
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      logger.warn('User not found', {
        context: 'UserAPI'
      });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ user: data });
    
  } catch (err) {
    logger.error('Unexpected error in user API', {
      error: err,
      context: 'UserAPI'
    });
    return NextResponse.json({ 
      error: "Server error", 
      message: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
} 