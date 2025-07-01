"use client";

import { CalendarDays, Clock, FileText, Heart, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UsageTracker } from "../../components/features/dashboard/UsageTracker";
import Sidebar from "../../components/layout/Sidebar";
import { Button } from "../../components/ui/base/Button";
import { useAuth } from "../../context/AuthContext";
import { useSavedResumes } from "../../hooks/api/useSavedResumes";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  
  // Get saved resumes
  const { savedResumes, loading: resumesLoading, error: resumesError } = useSavedResumes();
  
  // Handle redirect to login if not authenticated and finished loading
  useEffect(() => {
    // Only redirect if not loading, no user, and we haven't tried redirecting yet
    if (!isLoading && !user && !redirecting && sessionChecked) {
      setRedirecting(true);
      
      // Redirect to login instead of home
      router.replace("/login");
    }
    
    // Mark session as checked once loading is complete
    if (!isLoading && !sessionChecked) {
      setSessionChecked(true);
    }
  }, [user, isLoading, router, redirecting, sessionChecked]);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Show loading state when authentication is pending
  if (isLoading || !sessionChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
        {/* Sidebar Skeleton - Hidden on mobile, visible on desktop */}
        <div className="hidden md:block w-64 bg-gray-200 animate-pulse"></div>
        
        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 pt-16 md:pt-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Header Skeleton - Responsive text sizes */}
            <div className="mb-8 md:mb-10">
              <div className="h-6 md:h-8 w-64 md:w-80 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-3 md:h-4 w-72 md:w-96 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Usage Tracker Skeleton - Responsive padding */}
            <div className="mb-8 md:mb-10">
              <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-5 md:h-6 w-24 md:w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 md:h-8 w-16 md:w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 md:h-4 w-36 md:w-48 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            
            {/* Quick Actions Section Skeleton - Responsive grid and padding */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 lg:p-8 border border-gray-200 mb-8 md:mb-10">
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 md:h-8 w-48 md:w-80 bg-gray-200 rounded animate-pulse"></div>
              </div>
              
              {/* Responsive grid: 1 column on mobile, 3 on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {/* Primary Action Skeleton - Full width on mobile, 2 columns on desktop */}
                <div className="md:col-span-2">
                  <div className="bg-gray-300 rounded-xl md:rounded-2xl p-4 md:p-6 h-40 md:h-48">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                      <div className="w-10 h-10 md:w-14 md:h-14 bg-gray-400 rounded-lg md:rounded-xl animate-pulse"></div>
                      <div className="h-4 md:h-6 w-20 md:w-24 bg-gray-400 rounded animate-pulse"></div>
                    </div>
                    <div className="h-6 md:h-8 w-48 md:w-64 bg-gray-400 rounded animate-pulse mb-2"></div>
                    <div className="h-3 md:h-4 w-full bg-gray-400 rounded animate-pulse mb-3 md:mb-4"></div>
                    <div className="h-4 md:h-6 w-24 md:w-32 bg-gray-400 rounded animate-pulse"></div>
                  </div>
                </div>
                
                {/* Secondary Actions Skeleton - Stack on mobile, column on desktop */}
                <div className="space-y-3 md:space-y-4">
                  <div className="bg-gray-200 rounded-lg md:rounded-xl p-3 md:p-4 h-20 md:h-24">
                    <div className="flex items-center gap-2 md:gap-3 mb-2">
                      <div className="w-7 h-7 md:w-9 md:h-9 bg-gray-300 rounded-md md:rounded-lg animate-pulse"></div>
                      <div className="h-4 md:h-5 w-24 md:w-32 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                    <div className="h-3 md:h-4 w-32 md:w-40 bg-gray-300 rounded animate-pulse"></div>
                  </div>

                  <div className="bg-gray-200 rounded-lg md:rounded-xl p-3 md:p-4 h-20 md:h-24">
                    <div className="flex items-center gap-2 md:gap-3 mb-2">
                      <div className="w-7 h-7 md:w-9 md:h-9 bg-gray-300 rounded-md md:rounded-lg animate-pulse"></div>
                      <div className="h-4 md:h-5 w-28 md:w-36 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                    <div className="h-3 md:h-4 w-36 md:w-44 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom Section Grid Skeleton - Stack on mobile, side-by-side on large screens */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {/* Saved Resumes Section Skeleton - Full width on mobile/tablet, 2/3 on large screens */}
              <div className="lg:col-span-2 bg-white rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 lg:p-8 border border-gray-200">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <div className="h-5 md:h-7 w-32 md:w-40 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 md:h-4 w-12 md:w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
                
                <div className="space-y-3 md:space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-3 md:p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="h-4 md:h-5 w-2/3 md:w-3/4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 md:h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-2 md:h-3 w-1/3 md:w-1/2 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div className="h-3 md:h-4 w-10 md:w-12 bg-gray-200 rounded animate-pulse ml-3 md:ml-4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Upcoming Section Skeleton - Full width on mobile/tablet, 1/3 on large screens */}
              <div className="bg-white rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 lg:p-8 border border-gray-200">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <div className="h-5 md:h-7 w-20 md:w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 md:h-4 w-16 md:w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
                
                <div className="flex flex-col items-center justify-center py-6 md:py-8 lg:py-12 text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-200 rounded-xl md:rounded-2xl mb-3 md:mb-4 animate-pulse"></div>
                  <div className="h-4 md:h-6 w-24 md:w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 md:h-4 w-36 md:w-48 bg-gray-200 rounded animate-pulse mb-3 md:mb-4"></div>
                  <div className="h-6 md:h-8 w-20 md:w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  // If not authenticated, redirect to login (this should rarely show due to middleware)
  if (!user) {
    // Immediately redirect to login
    router.replace("/login");
    return null;
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

          {/* Usage Tracker - Prominently displayed for free users */}
          <div className="mb-8 md:mb-10">
            <UsageTracker />
          </div>
          
          {/* Personalized Quick Actions */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200 mb-8 md:mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-2xl">👋</div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">What would you like to do today?</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Primary Action */}
              <Link href="/resume/create" className="md:col-span-2 block group">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-blue-100 text-sm font-medium">🚀 Start Here</div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Create Resume</h3>
                  <p className="text-blue-100 mb-4">Build a professional resume from scratch with AI-powered assistance</p>
                  <div className="flex items-center text-blue-100 font-medium">
                    <span>Get Started</span>
                    <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
              
              {/* Secondary Actions */}
              <div className="space-y-4">
                <Link href="/resume/optimize" className="block group">
                  <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                      </div>
                      <h3 className="font-bold text-gray-900 group-hover:text-purple-600">Optimize Resume</h3>
                    </div>
                    <p className="text-sm text-gray-600">Upload and optimize existing resume</p>
                  </div>
                </Link>

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
                
                {/* <Link href="/interview-prep" className="block group">
                  <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                      <h3 className="font-bold text-gray-900 group-hover:text-green-600">Practice Interview</h3>
                    </div>
                    <p className="text-sm text-gray-600">AI-powered interview simulation</p>
                  </div>
                </Link> */}
              </div>
            </div>
          </div>
          
          {/* Saved Resumes / Recent Activity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Saved Resumes</h2>
                <Link href="/saved-resumes" className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline">View all</Link>
              </div>
              
              {/* Loading State */}
              {resumesLoading && (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse ml-4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error State */}
              {resumesError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">Failed to load saved resumes. Please try again.</p>
                </div>
              )}

              {/* Empty State */}
              {!resumesLoading && !resumesError && savedResumes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
                  <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-6 rounded-2xl mb-4 shadow-lg">
                    <div className="text-4xl mb-2">📄</div>
                    <FileText className="h-8 w-8 text-blue-600 mx-auto" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Saved Resumes Yet!</h3>
                  <p className="text-gray-600 mb-6 max-w-sm leading-relaxed">
                    Create your first resume to start building your professional profile.
                  </p>
                  <div className="flex gap-3">
                    <Link href="/resume/create">
                      <Button className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                        🎯 Create Resume
                      </Button>
                    </Link>
                    <Link href="/resume/dashboard">
                      <Button variant="outline" className="px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                        📊 Optimize Existing
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Resumes List */}
              {!resumesLoading && !resumesError && savedResumes.length > 0 && (
                <div className="space-y-4">
                  {savedResumes.slice(0, 3).map((resume) => (
                    <div key={resume.id} className="group border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                              {resume.title}
                            </h4>
                            {resume.is_primary && (
                              <span title="Primary Resume">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              </span>
                            )}
                            {resume.is_favorite && (
                              <span title="Favorite">
                                <Heart className="h-4 w-4 text-red-500 fill-current" />
                              </span>
                            )}
                          </div>
                          
                          {resume.job_description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {resume.job_description.substring(0, 100)}...
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(resume.updated_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              Resume
                            </span>
                          </div>
                        </div>
                        
                        <Link 
                          href={`/saved-resumes/${resume.id}`}
                          className="ml-4 text-blue-600 hover:text-blue-700 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  ))}
                  
                  {savedResumes.length > 3 && (
                    <div className="text-center pt-4">
                      <Link href="/saved-resumes">
                        <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                          View {savedResumes.length - 3} more resumes
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
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
                <Button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm shadow-md hover:shadow-lg transition-all duration-200">
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