"use client";

import { CalendarDays, CheckCircle, Clock, FileText, Lightbulb, LogOut, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";

export default function Dashboard() {
  const { user, signOut, isLoading, authError } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  
  // Manually fetch session status for Vercel deployments
  useEffect(() => {
    async function checkSession() {
      try {
        if (!sessionChecked && !isLoading) {
          setSessionChecked(true);
          // If user is not authenticated, redirect
          if (!user && !redirecting) {
            setRedirecting(true);
            // Replace URL to avoid history issues
            window.location.href = "/";
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    }
    
    checkSession();
  }, [user, isLoading, redirecting, sessionChecked]);
  
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
              onClick={() => window.location.href = "/"}
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-xl font-bold text-blue-600">
            <Link href="/dashboard">CareerPal Dashboard</Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              {user.email}
            </span>
            <button 
              onClick={signOut}
              className="flex items-center text-sm text-red-600 hover:text-red-800"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Sign Out
            </button>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1">
        <nav className="hidden md:block w-64 border-r bg-white p-4">
          <div className="space-y-1">
            <Link href="/dashboard" className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-700">
              <FileText className="mr-3 h-5 w-5 text-blue-500" />
              Dashboard
            </Link>
            <Link href="/resume-builder" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-blue-700 hover:bg-gray-100">
              <FileText className="mr-3 h-5 w-5 text-gray-400" />
              Resume Builder
            </Link>
            <Link href="/interview-prep" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-blue-700 hover:bg-gray-100">
              <Users className="mr-3 h-5 w-5 text-gray-400" />
              Interview Prep
            </Link>
          </div>
        </nav>
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.name || user.email}</h1>
              <p className="text-gray-600 mt-2">Manage your job applications and career tools all in one place.</p>
            </div>
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Applications</p>
                    <h3 className="text-2xl font-bold text-gray-900">0</h3>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Interviews</p>
                    <h3 className="text-2xl font-bold text-gray-900">0</h3>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Hours Saved</p>
                    <h3 className="text-2xl font-bold text-gray-900">0</h3>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-100 p-3 rounded-lg">
                    <Lightbulb className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Skills Added</p>
                    <h3 className="text-2xl font-bold text-gray-900">0</h3>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Get Started Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Get Started</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/resume-builder" className="block group">
                  <div className="border border-gray-200 rounded-lg p-5 transition-all duration-200 hover:border-blue-500 hover:shadow-md">
                    <div className="bg-blue-100 p-2 rounded-lg w-fit mb-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2 group-hover:text-blue-600">Create Resume</h3>
                    <p className="text-sm text-gray-600">Build an ATS-optimized resume with AI assistance.</p>
                  </div>
                </Link>
                
                <Link href="/interview-prep" className="block group">
                  <div className="border border-gray-200 rounded-lg p-5 transition-all duration-200 hover:border-green-500 hover:shadow-md">
                    <div className="bg-green-100 p-2 rounded-lg w-fit mb-3">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2 group-hover:text-green-600">Practice Interviews</h3>
                    <p className="text-sm text-gray-600">Prepare for interviews with AI simulation.</p>
                  </div>
                </Link>
                
                <Link href="/cover-letter" className="block group">
                  <div className="border border-gray-200 rounded-lg p-5 transition-all duration-200 hover:border-purple-500 hover:shadow-md">
                    <div className="bg-purple-100 p-2 rounded-lg w-fit mb-3">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2 group-hover:text-purple-600">Generate Cover Letter</h3>
                    <p className="text-sm text-gray-600">Create custom cover letters for each application.</p>
                  </div>
                </Link>
              </div>
            </div>
            
            {/* Recent Activity / Calendar Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                  <Link href="/activity" className="text-sm text-blue-600 hover:underline">View all</Link>
                </div>
                
                {/* Empty state */}
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="bg-gray-100 p-3 rounded-full mb-3">
                    <Clock className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-gray-900 font-medium mb-1">No recent activity</h3>
                  <p className="text-gray-500 text-sm max-w-md">
                    Start by creating a resume, practicing interviews, or generating a cover letter.
                  </p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Upcoming</h2>
                  <Link href="/calendar" className="text-sm text-blue-600 hover:underline">View calendar</Link>
                </div>
                
                {/* Empty state */}
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="bg-gray-100 p-3 rounded-full mb-3">
                    <CalendarDays className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-gray-900 font-medium mb-1">No upcoming events</h3>
                  <p className="text-gray-500 text-sm">
                    Schedule interviews and track application deadlines.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 