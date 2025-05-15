import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import logger from "../../../../lib/logger";

// Extended JWT type to include our custom properties
interface ExtendedJWT extends JWT {
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
  error?: string;
}

// Determine site URL for correct cookie settings
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

// Configure Auth.js options
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Configure proper cookie handling for Vercel
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production" || NEXTAUTH_URL.startsWith("https://"),
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production" || NEXTAUTH_URL.startsWith("https://"),
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production" || NEXTAUTH_URL.startsWith("https://"),
      },
    },
  },
  callbacks: {
    async jwt({ token, account, user }) {
      const extendedToken = token as ExtendedJWT;
      
      // Initial sign in
      if (account && user) {
        logger.debug("JWT callback - initial sign in", { 
          user: { 
            id: user.id, 
            email: user.email
          }, 
          context: "Auth"
        });
        
        // Save additional user info to the token
        return {
          ...extendedToken,
          userId: user.id,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
        };
      }

      // Return previous token if the access token has not expired yet
      if (extendedToken.accessTokenExpires && Date.now() < extendedToken.accessTokenExpires) {
        return extendedToken;
      }

      // Access token has expired, try to update it
      // For this implementation, we'll just return the existing token
      return extendedToken;
    },
    async session({ session, token }) {
      const extendedToken = token as ExtendedJWT;
      
      if (extendedToken) {
        logger.debug("Session callback", { 
          // Token is automatically masked by the logger
          context: "Auth"
        });
        
        // Add custom properties to the session from the token
        if (extendedToken.sub) {
          session.user.id = extendedToken.sub;
          logger.debug("Set user ID from sub", { 
            context: "Auth"
          });
        } else if (extendedToken.userId) {
          session.user.id = extendedToken.userId;
          logger.debug("Set user ID from userId", { 
            context: "Auth"
          });
        }
        
        session.accessToken = extendedToken.accessToken;
        session.error = extendedToken.error;
        
        // Add user metadata if available
        if (extendedToken.picture) {
          session.user.image = extendedToken.picture;
        }
        
        if (extendedToken.name) {
          session.user.name = extendedToken.name;
        }
        
        if (extendedToken.email) {
          session.user.email = extendedToken.email;
        }
        
        logger.debug("Session user configured", { 
          user: {
            email: session.user.email,
            name: session.user.name,
            hasImage: !!session.user.image
          },
          context: "Auth"
        });
      }
      
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle redirects after sign in
      logger.debug("Processing redirect", { 
        url, 
        baseUrl,
        context: "Auth" 
      });
      
      // Direct dashboard URLs without base are allowed
      if (url === '/dashboard' || url.startsWith('/dashboard/')) {
        return `${baseUrl}${url}`;
      }
      
      // Handle relative URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      } else if (new URL(url).origin === baseUrl) {
        // If it's the same origin, don't redirect
        return url;
      } else if (url.startsWith("http")) {
        // External URLs - be careful with this for security reasons
        const allowedHosts = [new URL(baseUrl).host];
        const urlHost = new URL(url).host;
        
        if (allowedHosts.includes(urlHost)) {
          return url;
        }
      }
      
      // Default redirect to dashboard for logged in users
      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: '/', // Custom sign-in page
    signOut: '/', // Custom sign-out page
    error: '/', // Error page
  },
  // Disable debug mode in all environments for security
  debug: false,
}; 