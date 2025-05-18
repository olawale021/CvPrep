"use client";

import { CalendarDays, CheckCircle, Clock, FileText, Lightbulb, Users } from "lucide-react";
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
        <div className="w-12 h-12 border-t-4 border-blue-600 border-solid rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Loading your dashboard...</p>
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
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome, {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'User'}</h1>
            <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">Manage your job applications and career tools all in one place.</p>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="bg-blue-100 p-2 md:p-3 rounded-lg">
                  <FileText className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-500">Applications</p>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900">0</h3>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="bg-green-100 p-2 md:p-3 rounded-lg">
                  <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-500">Interviews</p>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900">0</h3>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="bg-purple-100 p-2 md:p-3 rounded-lg">
                  <Clock className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-500">Hours Saved</p>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900">0</h3>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="bg-amber-100 p-2 md:p-3 rounded-lg">
                  <Lightbulb className="h-5 w-5 md:h-6 md:w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-500">Skills Added</p>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900">0</h3>
                </div>
              </div>
            </div>
          </div>
          
          {/* Get Started Section */}
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 mb-6 md:mb-8">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Get Started</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              <Link href="/optimize" className="block group">
                <div className="border border-gray-200 rounded-lg p-4 md:p-5 transition-all duration-200 hover:border-blue-500 hover:shadow-md">
                  <div className="bg-blue-100 p-2 rounded-lg w-fit mb-2 md:mb-3">
                    <FileText className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1 md:mb-2 group-hover:text-blue-600 text-sm md:text-base">Create Resume</h3>
                  <p className="text-xs md:text-sm text-gray-600">Build an ATS-optimized resume with AI assistance.</p>
                </div>
              </Link>
              
              <Link href="/interview-prep" className="block group">
                <div className="border border-gray-200 rounded-lg p-4 md:p-5 transition-all duration-200 hover:border-green-500 hover:shadow-md">
                  <div className="bg-green-100 p-2 rounded-lg w-fit mb-2 md:mb-3">
                    <Users className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1 md:mb-2 group-hover:text-green-600 text-sm md:text-base">Practice Interviews</h3>
                  <p className="text-xs md:text-sm text-gray-600">Prepare for interviews with AI simulation.</p>
                </div>
              </Link>
              
              <Link href="/cover-letter" className="block group">
                <div className="border border-gray-200 rounded-lg p-4 md:p-5 transition-all duration-200 hover:border-purple-500 hover:shadow-md">
                  <div className="bg-purple-100 p-2 rounded-lg w-fit mb-2 md:mb-3">
                    <FileText className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1 md:mb-2 group-hover:text-purple-600 text-sm md:text-base">Generate Cover Letter</h3>
                  <p className="text-xs md:text-sm text-gray-600">Create custom cover letters for each application.</p>
                </div>
              </Link>
            </div>
          </div>
          
          {/* Recent Activity / Calendar Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Recent Activity</h2>
                <Link href="/activity" className="text-xs md:text-sm text-blue-600 hover:underline">View all</Link>
              </div>
              
              {/* Empty state */}
              <div className="flex flex-col items-center justify-center py-6 md:py-10 text-center">
                <div className="bg-gray-100 p-3 rounded-full mb-3">
                  <Clock className="h-5 w-5 md:h-6 md:w-6 text-gray-400" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1 text-sm md:text-base">No recent activity</h3>
                <p className="text-gray-500 text-xs md:text-sm max-w-md">
                  Start by creating a resume, practicing interviews, or generating a cover letter.
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Upcoming</h2>
                <Link href="/calendar" className="text-xs md:text-sm text-blue-600 hover:underline">View calendar</Link>
              </div>
              
              {/* Empty state */}
              <div className="flex flex-col items-center justify-center py-6 md:py-10 text-center">
                <div className="bg-gray-100 p-3 rounded-full mb-3">
                  <CalendarDays className="h-5 w-5 md:h-6 md:w-6 text-gray-400" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1 text-sm md:text-base">No upcoming events</h3>
                <p className="text-gray-500 text-xs md:text-sm">
                  Schedule interviews and track application deadlines.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 