"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { } = useAuth();
  
  // Handle localStorage fallback for redirects
  useEffect(() => {
    // Check if we're in the browser and have localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        // If we're at the dashboard, clear any redirect
        if (window.location.pathname === '/dashboard') {
          localStorage.removeItem('authRedirectTo');
        }
      } catch (err) {
        console.error('Error accessing localStorage:', err);
      }
    }
  }, []);
  
  // Always render dashboard content, authentication is handled at the page level
  return <>{children}</>;
} 