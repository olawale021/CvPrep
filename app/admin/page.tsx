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
import { isAdminEmail } from "../../lib/auth/adminConfig";

type AdminTab = "dashboard" | "users" | "analytics" | "settings" | "feedback";

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  // Admin access check using centralized configuration
  if (!user || !isAdminEmail(user.email)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to view this page.</p>
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
  const [pagination, setPagination] = useState({ total: 0, limit: 50, offset: 0 });
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
        setPagination(prev => ({
          ...prev,
          total: data.total || 0
        }));
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
    if (!confirm(`Reset usage for ${userEmail}? This will clear their daily rate limits.`)) {
      return;
    }

    try {
      const response = await fetch('/api/reset-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (response.ok) {
        alert(`Usage reset successfully for ${userEmail}`);
        // Refresh the users list to show updated data
        fetchUsers();
      } else {
        const errorData = await response.json();
        alert(`Failed to reset usage: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error resetting usage:', error);
      alert('Error resetting user usage');
    }
  };

  // Search with debounce
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    // Reset to first page when searching
    setPagination(prev => ({ ...prev, offset: 0 }));
    setTimeout(() => fetchUsers(value), 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Total: {pagination.total} users
          </p>
        </div>
        <Button onClick={() => fetchUsers()} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh Users'}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchUsers()} 
              className="mt-2"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="text"
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
          <CardDescription>
            Manage user accounts and rate limits. Usage stats show last 30 days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 && !loading ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No users found. Click &#34;Refresh Users&ldquo; to load data.</p>
            </div>
          ) : loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-64 bg-gray-200 rounded animate-pulse"></div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <div key={j} className="space-y-1">
                            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="h-8 w-24 bg-gray-200 rounded animate-pulse ml-4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">{user.email}</h4>
                        <div className="flex gap-2">
                          <Badge variant={user.type === 'premium' ? 'default' : user.type === 'admin' ? 'default' : 'secondary'}>
                            {user.type || 'free'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {user.id.slice(0, 8)}...
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Usage Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                        <div className="text-sm">
                          <p className="text-gray-600">Total Usage (30d)</p>
                          <p className="font-medium text-blue-600">{user.usage?.total || 0}</p>
                        </div>
                        <div className="text-sm">
                          <p className="text-gray-600">Created</p>
                          <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-sm">
                          <p className="text-gray-600">Last Updated</p>
                          <p className="font-medium">{user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="text-sm">
                          <p className="text-gray-600">Status</p>
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        </div>
                      </div>

                      {/* Feature Usage Breakdown */}
                      {user.usage?.features && Object.keys(user.usage.features).length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-2">Feature Usage (30d):</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(user.usage.features).map(([feature, count]) => (
                              <Badge key={feature} variant="outline" className="text-xs">
                                {feature.replace('_', ' ')}: {count}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetUserUsage(user.id, user.email)}
                        disabled={loading}
                      >
                        Reset Usage
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 