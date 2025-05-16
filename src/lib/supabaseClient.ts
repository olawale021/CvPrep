import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { getSession } from 'next-auth/react';
import logger from './logger';

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

// Create a basic supabase client for initialization
const supabaseClient = isClient
  ? createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    })
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
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

// Export supabase client with auth header injection
export const supabase = {
  ...supabaseClient,
  from: (table: string) => {
    // Get current auth status from getSession if on client
    return supabaseClient.from(table);
  },
  storage: {
    ...supabaseClient.storage,
    // Override the 'from' method to inject auth headers
    from: (bucket: string) => {
      const bucketClient = supabaseClient.storage.from(bucket);
      
      // Override upload method to inject auth headers
      const originalUpload = bucketClient.upload;
      bucketClient.upload = async (path: string, fileBody: File | Blob | ArrayBuffer | string, options?: Record<string, unknown>) => {
        try {
          if (isClient) {
            // Get the session on upload to have the most current token
            const session = await getSession();
            if (session?.user?.id) {
              // Use the user ID from the session to set RLS auth
              const headers = {
                'X-Client-Info': 'supabase-js/2.x',
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'x-supabase-auth-id': session.user.id
              };
              
              // Create an options object with the headers
              const newOptions = {
                ...(options || {}),
                headers: {
                  ...(options?.headers || {}),
                  ...headers
                }
              };
              
              logger.debug('Uploading with auth headers', { 
                userId: session.user.id,
                context: 'SupabaseClient' 
              });
              
              return originalUpload(path, fileBody, newOptions);
            }
          }
          
          // Fallback to original upload if no session
          return originalUpload(path, fileBody, options);
        } catch (error) {
          logger.error('Error in storage upload with auth', { 
            error, 
            context: 'SupabaseClient' 
          });
          return originalUpload(path, fileBody, options);
        }
      };
      
      return bucketClient;
    }
  }
};

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