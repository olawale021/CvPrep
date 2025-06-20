"use client";

import { AlertCircle, CheckCircle, Clock, MessageSquare } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "../../../components/ui/base/Badge";
import { Button } from "../../../components/ui/base/Button";
import { Card } from "../../../components/ui/base/Card";
import { useAuth } from "../../../context/AuthContext";
import { isAdminEmail } from "../../../lib/auth/adminConfig";

interface FeedbackItem {
  id: string;
  user_id: string;
  category: string;
  type: 'bug' | 'feature' | 'improvement' | 'other';
  rating: number;
  title: string;
  description: string;
  user_email?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
  admin_notes?: string;
  user_name?: string;
  url?: string;
  user_agent?: string;
}

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800", 
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800"
};

const statusColors = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  resolved: "bg-green-100 text-green-800", 
  closed: "bg-gray-100 text-gray-800"
};

const typeIcons = {
  bug: "🐛",
  feature: "✨", 
  improvement: "🔧",
  other: "💬"
};

export default function AdminFeedbackPage() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Move all hooks before any early returns
  const fetchFeedback = useCallback(async () => {
    try {
      const status = selectedStatus === "all" ? "" : selectedStatus;
      const response = await fetch(`/api/feedback${status ? `?status=${status}` : ""}`);
      
      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback || []);
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="ml-4 space-y-2">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-2 flex-1">
                    <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse ml-4"></div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Feedback Dashboard</h1>
          <p className="text-gray-600">Manage user feedback, bug reports, and feature requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Feedback</p>
                <p className="text-2xl font-bold text-gray-900">{feedback.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New Items</p>
                <p className="text-2xl font-bold text-gray-900">
                  {feedback.filter(f => f.status === "open").length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {feedback.filter(f => f.status === "in_progress").length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {feedback.filter(f => f.status === "resolved").length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex gap-2">
            {["all", "open", "in_progress", "resolved"].map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? "default" : "outline"}
                onClick={() => setSelectedStatus(status as "all" | "open" | "in_progress" | "resolved")}
                className="capitalize"
              >
                {status.replace("_", " ")}
              </Button>
            ))}
          </div>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {feedback.length === 0 ? (
            <Card className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback found</h3>
              <p className="text-gray-600">No feedback matches the current filter.</p>
            </Card>
          ) : (
            feedback.map((item) => (
              <Card key={item.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{typeIcons[item.type]}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {item.title}
                      </h3>
                      <div className="flex gap-2">
                        <Badge className={`${priorityColors[item.priority]} text-xs font-medium`}>
                          {item.priority} priority
                        </Badge>
                        <Badge className={`${statusColors[item.status]} text-xs font-medium`}>
                          {item.status.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>

                <p className="text-gray-700 mb-4 leading-relaxed">{item.description}</p>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">User:</span> {item.user_email || "Anonymous"}
                    </div>
                    <div>
                      <span className="font-medium">Page:</span> {item.url || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Browser:</span> {item.user_agent?.split(" ")[0] || "N/A"}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 