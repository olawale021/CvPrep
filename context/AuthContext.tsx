'use client';

import { Session, User } from '@supabase/supabase-js';
// import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/auth/supabaseClient';
import logger from '../lib/core/logger';

// Type for your app's user
export type AppUser = {
  id: string;
  email: string;
  type: 'free' | 'premium';
  full_name?: string;
  profile_picture?: string;
  // Add other fields as needed
};

// Type for the auth context value
export type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGoogle: (redirectPath?: string) => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
  appUser: AppUser | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  // const router = useRouter();

  // Listen for auth state changes
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });
    // Initial load
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Handle user database operations and fetch app user data
  useEffect(() => {
    const handleUserDatabase = async () => {
      if (user && user.id && user.email) {
        logger.debug('Checking if user exists in database', {
          email: user.email,
          context: 'AuthContext',
        });
        
        try {
          // First, check if user already exists
          const checkResponse = await fetch(`/api/user?email=${encodeURIComponent(user.email)}`);
          
          if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            if (checkData.user) {
              logger.debug('User already exists in database, skipping save', {
                email: user.email,
                context: 'AuthContext',
              });
              // Set appUser with existing data
              setAppUser(checkData.user);
              return; // User exists, no need to save
            }
          }
          
          // User doesn't exist, proceed with saving
          logger.debug('User not found in database, creating new user', {
            email: user.email,
            context: 'AuthContext',
          });
          
          const googleId = user.user_metadata?.provider_id || user.user_metadata?.sub || user.id;
          
          // Use the API route to create new user
          const response = await fetch('/api/user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: user.id,
              email: user.email,
              name: user.user_metadata?.full_name || user.email,
              image: user.user_metadata?.avatar_url || null,
              googleId,
            }),
          });
          
          const result = await response.json();
          
          logger.debug('Save new user to DB result', {
            success: result.success,
            error: result.error ? true : false,
            context: 'AuthContext',
          });
          
          if (result.error) {
            logger.error('Failed to save new user via API', {
              error: result.error,
              context: 'AuthContext',
            });
            setAppUser(null);
          } else {
            // Fetch the newly created user data
            const newUserResponse = await fetch(`/api/user?email=${encodeURIComponent(user.email)}`);
            if (newUserResponse.ok) {
              const newUserData = await newUserResponse.json();
              setAppUser(newUserData.user);
            }
          }
        } catch (err) {
          logger.error('Exception handling user database operations', {
            error: err,
            context: 'AuthContext',
          });
          setAppUser(null);
        }
      } else {
        setAppUser(null);
      }
    };
    if (user) {
      handleUserDatabase();
    } else {
      setAppUser(null);
    }
  }, [user]);

  // Redirect to dashboard after login
  // useEffect(() => {
  //   if (!isLoading && user) {
  //     router.push('/dashboard');
  //   }
  // }, [isLoading, user, router]);

  // Sign in with Google
  const signInWithGoogle = async (redirectPath?: string) => {
    setAuthError(null);
    try {
      // Get the correct base URL based on environment
      const getBaseUrl = () => {
        // In production, use the deployed domain
        if (process.env.NODE_ENV === 'production') {
          // For your Vercel deployment, use the known domain
          return 'https://cvprep.app';
        }
        // In development, use localhost
        return window.location.origin;
      };

      const baseUrl = getBaseUrl();
      const redirectTo = redirectPath 
        ? `${baseUrl}${redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`}` 
        : `${baseUrl}/dashboard`;

      logger.debug('Initiating Google sign-in', {
        redirectTo,
        baseUrl,
        environment: process.env.NODE_ENV,
        context: 'AuthContext',
      });
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        setAuthError(error.message);
        logger.error('Google sign-in error', { error, context: 'AuthContext' });
      }
    } catch (err) {
      setAuthError(String(err));
      logger.error('Google sign-in error', { error: err, context: 'AuthContext' });
    }
  };

  // Sign out
  const signOut = async () => {
    setAuthError(null);
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setAppUser(null);
      logger.debug('Signed out user', { context: 'AuthContext' });
    } catch (err) {
      setAuthError(String(err));
      logger.error('Sign-out error', { error: err, context: 'AuthContext' });
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    signInWithGoogle,
    signOut,
    authError,
    appUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
} 