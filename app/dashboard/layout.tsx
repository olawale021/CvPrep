"use client";

import { ReactNode, useEffect } from "react";
import { ErrorBoundary } from "../../components/ui/feedback/ErrorBoundary";
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
  return (
    <ErrorBoundary fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Dashboard Error</h1>
          <p className="text-gray-600 mb-6">
            There was an error loading the dashboard. Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    }>
      {children}
    </ErrorBoundary>
  );
} 