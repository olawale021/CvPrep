"use client";

import { AlertCircle, BarChart3, MessageSquare, Settings, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnalyticsDashboard } from "../../components/admin/AnalyticsDashboard";
import Sidebar from "../../components/layout/Sidebar";
import { Badge } from "../../components/ui/base/Badge";
import { Button } from "../../components/ui/base/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/base/Card";
import { useAuth } from "../../context/AuthContext";

type AdminTab = "dashboard" | "users" | "analytics" | "settings" | "feedback";

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);

  // Server-side admin check
  const checkAdminStatus = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setAdminCheckLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/check');
      const data = await response.json();
      
      setIsAdmin(data.isAdmin);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setAdminCheckLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      checkAdminStatus();
    }
  }, [authLoading, checkAdminStatus]);

  // Show loading state with skeleton
  if (authLoading || adminCheckLoading) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
        {/* Sidebar Skeleton */}
        <div className="hidden md:block w-64 bg-gray-200 animate-pulse"></div>
        
        {/* Main Content Skeleton */}
        <div className="flex-1 p-4 md:p-6 pt-16 md:pt-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {/* Header Skeleton */}
            <div className="mb-8">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Navigation Tabs Skeleton */}
            <div className="mb-8">
              <div className="border-b border-gray-200">
                <div className="flex space-x-8">
                  <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Quick Actions Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Card 1 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-3">
                  <div className="h-8 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-full bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="h-5 w-28 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-36 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-28 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-3">
                  <div>
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div>
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Section Skeleton */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="text-center">
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto"></div>
                  </div>
                ))}
              </div>

              {/* Chart Area */}
              <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin access check using server-side verification
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don&apos;t have permission to view this page.</p>
          {user && (
            <div className="text-sm text-gray-500">
              <p>Logged in as: {user.email}</p>
              <Link href="/admin/debug" className="text-blue-500 hover:underline">
                Debug admin access
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 p-4 md:p-6 pt-16 md:pt-6 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage users, analytics, and system settings</p>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "dashboard"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <BarChart3 className="h-4 w-4 inline mr-2" />
                  Analytics
                </button>
                <button
                  onClick={() => setActiveTab("users")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "users"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Users className="h-4 w-4 inline mr-2" />
                  User Management
                </button>
                <button
                  onClick={() => setActiveTab("feedback")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "feedback"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <MessageSquare className="h-4 w-4 inline mr-2" />
                  Feedback
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                    <CardDescription>Common admin tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab("users")}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Manage Users
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab("feedback")}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View Feedback
                    </Button>
                    <Link href="/admin/feedback">
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="h-4 w-4 mr-2" />
                        System Settings
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">System Status</CardTitle>
                    <CardDescription>Current system health</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">API Status</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Operational
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Database</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Connected
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Environment</span>
                      <Badge variant="secondary">
                        {process.env.NODE_ENV || 'development'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Admin Info</CardTitle>
                    <CardDescription>Your admin session</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <p className="text-gray-600">Logged in as:</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-600">Access Level:</p>
                      <Badge variant="default" className="bg-blue-100 text-blue-800">
                        Administrator
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Analytics Dashboard */}
              <AnalyticsDashboard />
            </div>
          )}

          {activeTab === "users" && (
            <div>
              <UserManagement />
            </div>
          )}

          {activeTab === "feedback" && (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Feedback Management</h3>
              <p className="text-gray-600 mb-4">
                Use the dedicated feedback page for full functionality
              </p>
              <Link href="/admin/feedback">
                <Button>
                  Go to Feedback Page
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// User Management Component
function UserManagement() {
  const [users, setUsers] = useState<Array<{
    id: string;
    email: string;
    type?: string;
    created_at: string;
    updated_at?: string;
    usage?: { total: number; features: Record<string, number> };
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (search = searchTerm) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        limit: '50',
        offset: '0',
        ...(search && { search })
      });
      
      const response = await fetch(`/api/admin/users?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.details || errorData.error || response.statusText;
        setError(`Failed to fetch users: ${errorMessage}`);
        console.error('Failed to fetch users:', errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Error fetching users: ${errorMessage}`);
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  // Auto-fetch users when component mounts
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const resetUserUsage = async (userId: string, userEmail: string) => {
    try {
      const response = await fetch('/api/reset-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (response.ok) {
        alert(`Usage reset successfully for ${userEmail}`);
        fetchUsers(); // Refresh the users list
      } else {
        const error = await response.json();
        alert(`Failed to reset usage: ${error.error}`);
      }
    } catch (error) {
      console.error('Error resetting usage:', error);
      alert('Error resetting usage');
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    // Debounce search or trigger immediately
    fetchUsers(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Button onClick={() => fetchUsers()} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
        />
                      </div>
                      
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
                        </div>
                      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={user.type === 'admin' ? 'default' : 'secondary'}>
                    {user.type || 'free'}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetUserUsage(user.id, user.email)}
                      >
                        Reset Usage
                      </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No users found
            </div>
          )}
      </div>
    </div>
  );
} 