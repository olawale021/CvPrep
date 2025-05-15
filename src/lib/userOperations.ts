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
}) {
  if (!user || !user.id || !user.email) {
    console.error('Invalid user data for database save');
    return { error: 'Invalid user data' };
  }
  
  try {
    // First check if this user already exists
    const userExists = await checkUserExists(user.email);
    
    if (userExists) {
      console.log(`User with email ${user.email} already exists, skipping save`);
      return { success: true, skipped: true };
    }
    
    // Convert OAuth numeric ID to UUID format
    const dbUserId = oauthIdToUuid(user.id);
    console.log('Saving user data to DB:', dbUserId, '(converted from:', user.id, ')', user.email);
    
    // Prepare the user data with all required fields
    const userData = {
      id: dbUserId, // Use the converted UUID
      google_id: user.id, // Store original OAuth ID in google_id column
      email: user.email,
      full_name: user.name || user.email,
      profile_picture: user.image || null,
      auth_provider: "google",
      is_active: true,
      is_verified: true,
      last_login: new Date().toISOString(),
    };
    
    console.log('User data prepared for save:', userData);
    
    // Perform the upsert operation
    const { error } = await supabase.from("users").upsert(
      userData,
      { 
        onConflict: "id",
        ignoreDuplicates: false
      }
    );
    
    if (error) {
      console.error("DB Save Error:", error);
      // Log more details about the error
      if (error.details) console.error("Error details:", error.details);
      if (error.hint) console.error("Error hint:", error.hint);
      
      return { error: error.message };
    } else {
      console.log("User data saved successfully for:", user.email);
      return { success: true };
    }
  } catch (err) {
    console.error("Unexpected error saving user:", err);
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