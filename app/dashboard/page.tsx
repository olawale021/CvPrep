"use client";

import { CalendarDays, Clock, FileText, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import Sidebar from "../../components/ui/Sidebar";
import { useAuth } from "../../context/AuthContext";

export default function Dashboard() {
  const { user, isLoading, authError } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  
  // Handle redirect to home if not authenticated and finished loading
  useEffect(() => {
    // Only redirect if not loading, no user, and we haven't tried redirecting yet
    if (!isLoading && !user && !redirecting && sessionChecked) {
      setRedirecting(true);
      
      // Use replace instead of push to avoid browser history issues
      router.replace("/");
    }
    
    // Mark session as checked once loading is complete
    if (!isLoading && !sessionChecked) {
      setSessionChecked(true);
    }
  }, [user, isLoading, router, redirecting, sessionChecked]);
  
  // Show loading state when authentication is pending
  if (isLoading || !sessionChecked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Dashboard</h3>
          <p className="text-gray-600">Setting up your personalized workspace...</p>
        </div>
      </div>
    );
  }
  
  // Show minimal UI when not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Access</h1>
          <p className="text-gray-600 mb-6">
            Please sign in to access your dashboard.
          </p>
          <div className="space-y-4">
            <Button
              onClick={() => router.replace("/")}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Return to Home
            </Button>
            
            {authError && (
              <p className="text-red-600 text-sm mt-4">{authError}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 pt-16 md:pt-6 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 md:mb-10">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome, {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'User'}</h1>
            <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">Manage your job applications and career tools all in one place.</p>
          </div>
          
          {/* Personalized Quick Actions */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200 mb-8 md:mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-2xl">👋</div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">What would you like to do today?</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Primary Action */}
              <Link href="/resume/dashboard" className="md:col-span-2 block group">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-blue-100 text-sm font-medium">🔥 Most Popular</div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Optimize My Resume</h3>
                  <p className="text-blue-100 mb-4">Upload your resume and get AI-powered optimization with instant scoring</p>
                  <div className="flex items-center text-blue-100 font-medium">
                    <span>Get Started</span>
                    <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
              
              {/* Secondary Actions */}
              <div className="space-y-4">
                <Link href="/cover-letter" className="block group">
                  <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <h3 className="font-bold text-gray-900 group-hover:text-purple-600">Generate Cover Letter</h3>
                    </div>
                    <p className="text-sm text-gray-600">Create custom letters for each job</p>
                  </div>
                </Link>
                
                <Link href="/interview-prep" className="block group">
                  <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                      <h3 className="font-bold text-gray-900 group-hover:text-green-600">Practice Interview</h3>
                    </div>
                    <p className="text-sm text-gray-600">AI-powered interview simulation</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Recent Activity / Calendar Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Recent Activity</h2>
                <Link href="/activity" className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline">View all</Link>
              </div>
              
              {/* Enhanced Empty state */}
              <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-6 rounded-2xl mb-4 shadow-lg">
                  <div className="text-4xl mb-2">🚀</div>
                  <Clock className="h-8 w-8 text-blue-600 mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Your Career Journey Starts Here!</h3>
                <p className="text-gray-600 mb-6 max-w-sm leading-relaxed">
                  You haven&apos;t started yet. Let&apos;s get your resume AI-optimized and start landing interviews!
                </p>
                <Link href="/resume/dashboard">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    🎯 Upload Resume Now
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Upcoming</h2>
                <Link href="/calendar" className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline">View calendar</Link>
              </div>
              
              {/* Enhanced Empty state */}
              <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
                <div className="bg-gradient-to-br from-green-100 to-blue-100 p-6 rounded-2xl mb-4 shadow-lg">
                  <div className="text-3xl mb-2">📅</div>
                  <CalendarDays className="h-6 w-6 text-green-600 mx-auto" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Schedule Interviews</h3>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  Track application deadlines and interview dates
                </p>
                <Button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm shadow-md hover:shadow-lg transition-all duration-200">
                  + Add Event
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 