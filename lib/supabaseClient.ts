import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import logger from './logger';

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables with proper error handling
if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('Missing required Supabase environment variables');
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

// This will only log in development mode
logger.debug('Initializing Supabase client', { 
  context: 'SupabaseClient'
});

// Helper function to determine if we're on the client side
const isClient = typeof window !== 'undefined';

// Create a supabase client with session persistence enabled
export const supabase = isClient
  ? createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    })
  : createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'Content-Type': 'application/json',
        },
      },
      db: {
        schema: 'public',
      },
    });

// Test the connection and log results
export async function testSupabaseConnection() {
  try {
    logger.info('Testing Supabase connection', { context: 'SupabaseClient' });
    const { error } = await supabase.from('users').select('*').limit(1);
    
    if (error) {
      logger.error('Failed to connect to Supabase', { error: error.message, context: 'SupabaseClient' });
      return false;
    }
    
    logger.info('Successfully connected to Supabase', { context: 'SupabaseClient' });
    return true;
  } catch (err) {
    logger.error('Unexpected error testing Supabase connection', { error: err, context: 'SupabaseClient' });
    return false;
  }
}