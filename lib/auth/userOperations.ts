import { supabase } from '../auth/supabaseClient';

/**
 * Check if a user with the given email already exists in the database
 */
export async function checkUserExists(email: string): Promise<boolean> {
  try {
  
    
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
    // Use the original UUID directly to match RLS policies
    // Don't convert it to avoid mismatches with Supabase auth
  

    // Prepare the user data for upsert
    const userData = {
      id: user.id, // Use the original ID from Supabase Auth
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
      if (existingUsers[0].id !== user.id) { // Compare with original UUID
        return { error: 'A user with this email already exists.' };
      }
    }

    // Now safe to upsert
    const { error } = await supabase
      .from('users')
      .upsert([userData], { onConflict: 'email' });
    if (error) {
      console.error('Error upserting user:', error);
      return { error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('Unexpected error saving user:', err);
    return { error: `Unexpected error: ${err}` };
  }
}

/**
 * Fetch user data from Supabase
 */
export async function getUserFromDB(userId: string) {
  try {
    // Use original ID for database lookup to match RLS policies
  
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user:', error);
      return { error: error.message };
    }
    

    return { data };
  } catch (err) {
    console.error('Unexpected error fetching user:', err);
    return { error: `Unexpected error: ${err}` };
  }
} 