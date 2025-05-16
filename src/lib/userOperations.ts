import { supabase } from './supabaseClient';
import { oauthIdToUuid } from './utils';

/**
 * Check if a user with the given email already exists in the database
 */
export async function checkUserExists(email: string): Promise<boolean> {
  try {
    console.log('Checking if user exists with email:', email);
    
    const { data, error } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .eq('email', email)
      .limit(1);
      
    if (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
    
    const exists = !!data && data.length > 0;
    console.log('User exists check result:', exists, 'found records:', data?.length || 0);
    return exists;
  } catch (err) {
    console.error('Unexpected error checking user existence:', err);
    return false;
  }
}

/**
 * Save or update user data in the Supabase database
 * This is separate from authentication and just handles database operations
 */
export async function saveUserToDB(user: {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  googleId: string;
}) {
  if (!user || !user.id || !user.email) {
    console.error('Invalid user data for database save');
    return { error: 'Invalid user data' };
  }

  try {
    // Prepare the user data for upsert
    const userData = {
      id: user.id,
      google_id: user.googleId,
      oauth_id: user.googleId,
      email: user.email,
      full_name: user.name || user.email,
      profile_picture: user.image || null,
      auth_provider: 'google',
      password_hash: null,
      is_active: true,
      is_verified: true,
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    // Check for duplicate emails before upsert
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email);

    if (existingUsers && existingUsers.length > 0) {
      if (existingUsers[0].id !== user.id) {
        return { error: 'A user with this email already exists.' };
      }
    }

    // Now safe to upsert
    const { error } = await supabase
      .from('users')
      .upsert([userData], { onConflict: 'email' });
    if (error) {
      return { error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { error: `Unexpected error: ${err}` };
  }
}

/**
 * Fetch user data from Supabase
 */
export async function getUserFromDB(userId: string) {
  try {
    // Convert OAuth ID to UUID for database lookup
    const dbUserId = oauthIdToUuid(userId);
    console.log('Fetching user data from DB for ID:', dbUserId, '(converted from:', userId, ')');
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', dbUserId)
      .single();
    
    if (error) {
      console.error('Error fetching user:', error);
      return { error: error.message };
    }
    
    console.log('User data fetched successfully:', data ? 'Found' : 'Not found');
    return { data };
  } catch (err) {
    console.error('Unexpected error fetching user:', err);
    return { error: `Unexpected error: ${err}` };
  }
} 