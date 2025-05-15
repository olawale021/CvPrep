'use client';

import { Session } from 'next-auth';
import { signOut as nextAuthSignOut, SessionProvider, signIn, useSession } from 'next-auth/react';
import { createContext, useContext, useEffect, useState } from 'react';
import logger from '../lib/logger';
import { saveUserToDB } from '../lib/userOperations';

// Type for the auth context value
type AuthContextType = {
  user: Session['user'] | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGoogle: (redirectPath?: string) => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
};

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component that wraps app with the auth context
function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [authError, setAuthError] = useState<string | null>(null);
  
  const isLoading = status === 'loading';
  const user = session?.user || null;

  // Debug logs using secure logger
  useEffect(() => {
    logger.debug('Auth session status updated', { 
      status, 
      isAuthenticated: !!session?.user,
      context: 'AuthContext'
    });
    
    // Clear any auth errors when session changes
    if (session?.user) {
      setAuthError(null);
    }
  }, [session, status]);

  // Save user to database when authenticated
  useEffect(() => {
    let isMounted = true;
    
    const handleUserDatabase = async () => {
      if (user && user.id && user.email) {
        logger.debug('Attempting to save user to database', {
          email: user.email,
          context: 'AuthContext'
        });
        
        // First try client-side save
        try {
          const result = await saveUserToDB({
            id: user.id,
            email: user.email,
            name: user.name || null,
            image: user.image || null
          });
          
          logger.debug('Save user to DB result', { 
            success: result.success,
            skipped: result.skipped,
            error: result.error ? true : false,
            context: 'AuthContext'
          });
          
          if (result.error) {
            logger.error('Failed to save user via client', {
              error: result.error,
              context: 'AuthContext'
            });
            
            // If client-side save fails, try server-side API
            logger.debug('Attempting server-side user save as fallback', {
              context: 'AuthContext'
            });
            const response = await fetch('/api/user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            const serverResult = await response.json();
            logger.debug('Server-side user save result', {
              success: serverResult.success,
              skipped: serverResult.skipped,
              error: serverResult.error ? true : false,
              context: 'AuthContext'
            });
            
            if (!response.ok && !serverResult.skipped) {
              logger.error('Server-side user save failed', {
                error: serverResult.error,
                context: 'AuthContext'
              });
            } else if (serverResult.skipped) {
              logger.debug('Server-side user save skipped - user already exists', {
                context: 'AuthContext'
              });
            } else {
              logger.info('User data saved successfully via server API', {
                context: 'AuthContext'
              });
            }
          } else if (result.skipped) {
            logger.debug('Client-side user save skipped - user already exists', {
              context: 'AuthContext'
            });
          } else {
            logger.info('User data saved successfully via client', {
              context: 'AuthContext'
            });
          }
        } catch (err) {
          if (isMounted) {
            logger.error('Exception saving user to database', {
              error: err,
              context: 'AuthContext'
            });
            
            // Try server-side API as a fallback for any client-side exception
            try {
              logger.debug('Attempting server-side user save after client exception', {
                context: 'AuthContext'
              });
              const response = await fetch('/api/user', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                }
              });
              
              const serverResult = await response.json();
              logger.debug('Server-side user save fallback result', {
                success: serverResult.success,
                skipped: serverResult.skipped,
                error: serverResult.error ? true : false,
                context: 'AuthContext'
              });
              
              if (!response.ok && !serverResult.skipped) {
                logger.error('Server-side fallback failed', {
                  error: serverResult.error,
                  context: 'AuthContext'
                });
              } else if (serverResult.skipped) {
                logger.debug('Server-side user save skipped - user already exists', {
                  context: 'AuthContext'
                });
              }
            } catch (serverErr) {
              logger.error('Server-side fallback also failed', {
                error: serverErr,
                context: 'AuthContext'
              });
            }
          }
        }
      } else {
        logger.debug('No valid user data available to save', {
          hasUser: !!user,
          hasId: !!user?.id,
          hasEmail: !!user?.email,
          context: 'AuthContext'
        });
      }
    };

    if (user) {
      handleUserDatabase();
    }
    
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Sign in with Google
  const signInWithGoogle = async (redirectPath?: string) => {
    try {
      logger.debug('Initiating Google sign-in', {
        redirectPath,
        context: 'AuthContext'
      });
      
      // Store the redirect URL in localStorage to handle full page redirections
      try {
        localStorage.setItem('authRedirectTo', redirectPath || '/dashboard');
      } catch (err) {
        logger.error('Error saving redirect to localStorage', {
          error: err,
          context: 'AuthContext'
        });
      }
      
      // Use next-auth's signIn function with the standard callbackUrl parameter
      await signIn('google', { callbackUrl: redirectPath || '/dashboard' });
    } catch (err) {
      logger.error('Google sign-in error', {
        error: err,
        context: 'AuthContext'
      });
      setAuthError(`Failed to sign in with Google: ${err}`);
    }
  };

  // Sign out
  const signOut = async () => {
    logger.debug('Signing out user', {
      context: 'AuthContext'
    });
    try {
      // Clear error state
      setAuthError(null);
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authRedirectTo');
      }
      
      // Sign out from NextAuth
      await nextAuthSignOut({ callbackUrl: '/' });
    } catch (err) {
      logger.error('Sign-out error', {
        error: err,
        context: 'AuthContext'
      });
      setAuthError(`Failed to sign out: ${err}`);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signInWithGoogle,
    signOut,
    authError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Provider that includes both NextAuth SessionProvider and our custom AuthContext
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextProvider>{children}</AuthContextProvider>
    </SessionProvider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 