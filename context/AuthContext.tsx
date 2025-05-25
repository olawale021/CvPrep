'use client';

import { Session, User } from '@supabase/supabase-js';
// import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import logger from '../lib/logger';
import { supabase } from '../lib/supabaseClient';

// Type for your app's user (from your DB)
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

  // Save user to database when authenticated
  useEffect(() => {
    const handleUserDatabase = async () => {
      if (user && user.id && user.email) {
        logger.debug('Attempting to save user to database', {
          email: user.email,
          context: 'AuthContext',
        });
        
        try {
          const googleId = user.user_metadata?.provider_id || user.user_metadata?.sub || user.id;
          
          // Use the API route instead of direct Supabase client call
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
          
          logger.debug('Save user to DB result', {
            success: result.success,
            error: result.error ? true : false,
            context: 'AuthContext',
          });
          
          if (result.error) {
            logger.error('Failed to save user via API', {
              error: result.error,
              context: 'AuthContext',
            });
          }
        } catch (err) {
          logger.error('Exception saving user to database', {
            error: err,
            context: 'AuthContext',
          });
        }
      }
    };
    if (user) {
      handleUserDatabase();
    }
  }, [user]);

  // Fetch app user (with type) from your DB
  useEffect(() => {
    const fetchAppUser = async () => {
      if (user?.email) {
        try {
          const res = await fetch(`/api/user?email=${encodeURIComponent(user.email)}`);
          if (res.ok) {
            const data = await res.json();
            setAppUser(data.user);
          } else {
            setAppUser(null);
          }
        } catch (err) {
          setAppUser(null);
        }
      } else {
        setAppUser(null);
      }
    };
    fetchAppUser();
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
      // Always use a full URL for redirectTo, defaulting to dashboard
      const redirectTo = redirectPath 
        ? `${window.location.origin}${redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`}` 
        : `${window.location.origin}/dashboard`;

      logger.debug('Initiating Google sign-in', {
        redirectTo,
        context: 'AuthContext',
      });
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
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