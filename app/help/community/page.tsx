"use client";

import {
    ArrowLeft,
    Award,
    BookOpen,
    Heart,
    MessageSquare,
    Star,
    TrendingUp,
    Users
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../../components/ui/base/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/base/Card";
import Sidebar from "../../../components/layout/Sidebar";

const communityStats = [
  { label: "Active Members", value: "12,500+", icon: <Users className="h-5 w-5" /> },
  { label: "Success Stories", value: "2,847", icon: <Star className="h-5 w-5" /> },
  { label: "Questions Answered", value: "18,934", icon: <MessageSquare className="h-5 w-5" /> },
  { label: "Job Offers", value: "5,621", icon: <TrendingUp className="h-5 w-5" /> }
];

const featuredDiscussions = [
  {
    title: "How I landed my dream job at Google using CareerPal",
    author: "Sarah Chen",
    replies: 47,
    likes: 156,
    category: "Success Stories",
    timeAgo: "2 days ago",
    featured: true
  },
  {
    title: "Best practices for optimizing tech resumes",
    author: "Mike Rodriguez",
    replies: 23,
    likes: 89,
    category: "Resume Tips",
    timeAgo: "1 day ago",
    featured: true
  },
  {
    title: "Interview prep strategies that actually work",
    author: "Jennifer Park",
    replies: 34,
    likes: 112,
    category: "Interview Prep",
    timeAgo: "3 days ago",
    featured: true
  }
];

const recentDiscussions = [
  {
    title: "Should I include my GPA on my resume?",
    author: "Alex Thompson",
    replies: 12,
    likes: 28,
    category: "Resume Help",
    timeAgo: "2 hours ago"
  },
  {
    title: "How to explain career gaps in interviews?",
    author: "Maria Garcia",
    replies: 8,
    likes: 19,
    category: "Interview Help",
    timeAgo: "4 hours ago"
  },
  {
    title: "Remote work resume optimization tips",
    author: "David Kim",
    replies: 15,
    likes: 42,
    category: "Resume Tips",
    timeAgo: "6 hours ago"
  },
  {
    title: "Negotiating salary as a new graduate",
    author: "Emma Wilson",
    replies: 21,
    likes: 67,
    category: "Career Advice",
    timeAgo: "8 hours ago"
  },
  {
    title: "Cover letter for career change - need feedback",
    author: "Robert Johnson",
    replies: 9,
    likes: 23,
    category: "Cover Letters",
    timeAgo: "12 hours ago"
  }
];

const topContributors = [
  {
    name: "Dr. Lisa Wang",
    title: "Career Coach",
    contributions: 234,
    badge: "Expert",
    avatar: "LW"
  },
  {
    name: "James Miller",
    title: "HR Director",
    contributions: 189,
    badge: "Mentor",
    avatar: "JM"
  },
  {
    name: "Rachel Green",
    title: "Recruiter",
    contributions: 156,
    badge: "Helper",
    avatar: "RG"
  },
  {
    name: "Tom Anderson",
    title: "Software Engineer",
    contributions: 142,
    badge: "Helper",
    avatar: "TA"
  }
];

const categories = [
  { name: "Success Stories", count: 1247, color: "bg-green-100 text-green-800" },
  { name: "Resume Help", count: 3456, color: "bg-blue-100 text-blue-800" },
  { name: "Interview Prep", count: 2134, color: "bg-purple-100 text-purple-800" },
  { name: "Career Advice", count: 1876, color: "bg-orange-100 text-orange-800" },
  { name: "Cover Letters", count: 987, color: "bg-pink-100 text-pink-800" },
  { name: "Networking", count: 654, color: "bg-indigo-100 text-indigo-800" }
];

export default function CommunityPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 pt-16 md:pt-6 overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link href="/help" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Help Center
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">CareerPal Community</h1>
                <p className="text-lg text-gray-600">
                  Connect with fellow job seekers, share experiences, and get expert advice
                </p>
              </div>
              <Button className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Join Discussion
              </Button>
            </div>
          </div>

          {/* Community Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {communityStats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-4 text-center">
                  <div className="flex justify-center mb-2 text-blue-600">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Featured Discussions */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Star className="h-6 w-6 text-yellow-500 mr-2" />
                  Featured Discussions
                </h2>
                <div className="space-y-4">
                  {featuredDiscussions.map((discussion, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <h3 className="font-semibold text-gray-900 mr-3">{discussion.title}</h3>
                              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                                Featured
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <span>by {discussion.author}</span>
                              <span className="mx-2">•</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                discussion.category === 'Success Stories' ? 'bg-green-100 text-green-800' :
                                discussion.category === 'Resume Tips' ? 'bg-blue-100 text-blue-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {discussion.category}
                              </span>
                              <span className="mx-2">•</span>
                              <span>{discussion.timeAgo}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {discussion.replies} replies
                          </div>
                          <div className="flex items-center">
                            <Heart className="h-4 w-4 mr-1" />
                            {discussion.likes} likes
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Recent Discussions */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Discussions</h2>
                <div className="space-y-3">
                  {recentDiscussions.map((discussion, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-1">{discussion.title}</h3>
                            <div className="flex items-center text-sm text-gray-600">
                              <span>by {discussion.author}</span>
                              <span className="mx-2">•</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                discussion.category === 'Resume Help' ? 'bg-blue-100 text-blue-800' :
                                discussion.category === 'Interview Help' ? 'bg-purple-100 text-purple-800' :
                                discussion.category === 'Resume Tips' ? 'bg-blue-100 text-blue-800' :
                                discussion.category === 'Career Advice' ? 'bg-orange-100 text-orange-800' :
                                'bg-pink-100 text-pink-800'
                              }`}>
                                {discussion.category}
                              </span>
                              <span className="mx-2">•</span>
                              <span>{discussion.timeAgo}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 text-sm text-gray-500">
                            <div className="flex items-center">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              {discussion.replies}
                            </div>
                            <div className="flex items-center">
                              <Heart className="h-3 w-3 mr-1" />
                              {discussion.likes}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <span className="font-medium text-gray-900">{category.name}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.color}`}>
                          {category.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Contributors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Top Contributors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topContributors.map((contributor, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-medium">
                          {contributor.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-900 mr-2">{contributor.name}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              contributor.badge === 'Expert' ? 'bg-purple-100 text-purple-800' :
                              contributor.badge === 'Mentor' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {contributor.badge}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">{contributor.title}</div>
                          <div className="text-xs text-gray-500">{contributor.contributions} contributions</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Community Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle>Community Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Be respectful and professional in all interactions</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Share constructive feedback and helpful advice</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Keep discussions relevant to career development</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>No spam, self-promotion, or inappropriate content</span>
                    </div>
                  </div>
                  <Link href="/help/community-guidelines">
                    <Button variant="outline" size="sm" className="w-full mt-4">
                      Read Full Guidelines
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-12">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Ready to Join the Conversation?
                </h3>
                <p className="text-gray-600 mb-6">
                  Share your experiences, ask questions, and help others on their career journey.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button className="w-full sm:w-auto">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start a Discussion
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Users className="h-4 w-4 mr-2" />
                    Browse All Topics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
} 