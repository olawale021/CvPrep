"use client";

import {
    BookOpen,
    CheckCircle,
    ChevronRight,
    Clock,
    FileText,
    GraduationCap,
    HelpCircle,
    MessageSquare,
    Search,
    Star,
    Users,
    Video
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import Sidebar from "../../components/ui/Sidebar";

const helpCategories = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Learn the basics of CareerPal and set up your account",
    icon: <BookOpen className="h-6 w-6" />,
    color: "bg-blue-500",
    articles: [
      { title: "Creating Your Account", time: "2 min read", popular: true },
      { title: "Dashboard Overview", time: "3 min read", popular: true },
      { title: "Uploading Your First Resume", time: "2 min read", popular: false },
      { title: "Account Settings", time: "2 min read", popular: false }
    ]
  },
  {
    id: "resume-optimizer",
    title: "Resume Optimizer",
    description: "Master the resume optimization features",
    icon: <FileText className="h-6 w-6" />,
    color: "bg-green-500",
    articles: [
      { title: "How Resume Scoring Works", time: "4 min read", popular: true },
      { title: "Understanding Your Score", time: "3 min read", popular: true },
      { title: "Optimizing Your Resume", time: "5 min read", popular: true },
      { title: "Downloading Optimized Resumes", time: "2 min read", popular: false }
    ]
  },
  {
    id: "interview-prep",
    title: "Interview Preparation",
    description: "Get ready for interviews with AI-powered practice",
    icon: <GraduationCap className="h-6 w-6" />,
    color: "bg-purple-500",
    articles: [
      { title: "Generating Interview Questions", time: "3 min read", popular: true },
      { title: "Practice Simulations", time: "4 min read", popular: true },
      { title: "Understanding Feedback", time: "3 min read", popular: false },
      { title: "Tips for Better Answers", time: "5 min read", popular: false }
    ]
  },
  {
    id: "cover-letters",
    title: "Cover Letters",
    description: "Create compelling cover letters for any job",
    icon: <MessageSquare className="h-6 w-6" />,
    color: "bg-orange-500",
    articles: [
      { title: "Generating Cover Letters", time: "3 min read", popular: true },
      { title: "Customizing Your Letter", time: "4 min read", popular: false },
      { title: "Best Practices", time: "5 min read", popular: true },
      { title: "Common Mistakes to Avoid", time: "4 min read", popular: false }
    ]
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    description: "Solve common issues and get technical support",
    icon: <HelpCircle className="h-6 w-6" />,
    color: "bg-red-500",
    articles: [
      { title: "File Upload Issues", time: "2 min read", popular: true },
      { title: "Login Problems", time: "2 min read", popular: true },
      { title: "Performance Issues", time: "3 min read", popular: false },
      { title: "Browser Compatibility", time: "2 min read", popular: false }
    ]
  },
  {
    id: "community",
    title: "Community & Support",
    description: "Connect with other users and get help",
    icon: <Users className="h-6 w-6" />,
    color: "bg-indigo-500",
    articles: [
      { title: "Community Guidelines", time: "3 min read", popular: false },
      { title: "Contacting Support", time: "2 min read", popular: true },
      { title: "Feature Requests", time: "2 min read", popular: false },
      { title: "Success Stories", time: "5 min read", popular: true }
    ]
  }
];

const popularArticles = [
  { title: "How to Score 90+ on Resume Optimization", category: "Resume Optimizer", time: "5 min read" },
  { title: "Top 10 Interview Questions and How to Answer Them", category: "Interview Prep", time: "8 min read" },
  { title: "Creating Your First Account", category: "Getting Started", time: "2 min read" },
  { title: "Writing Cover Letters That Get Noticed", category: "Cover Letters", time: "6 min read" }
];

const quickActions = [
  { title: "Watch Video Tutorials", icon: <Video className="h-5 w-5" />, href: "/help/videos" },
  { title: "Contact Support", icon: <MessageSquare className="h-5 w-5" />, href: "/help/contact" },
  { title: "Feature Requests", icon: <Star className="h-5 w-5" />, href: "/help/feedback" },
  { title: "System Status", icon: <CheckCircle className="h-5 w-5" />, href: "/help/status" }
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = helpCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.articles.some(article => 
      article.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 pt-16 md:pt-6 overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How can we help you?
            </h1>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              Find answers, learn new skills, and get the most out of CareerPal
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search for help articles, features, or topics..."
                className="pl-12 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4 text-center">
                    <div className="flex justify-center mb-2 text-blue-600">
                      {action.icon}
                    </div>
                    <p className="text-sm font-medium text-gray-900">{action.title}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Popular Articles */}
          {!searchQuery && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Star className="h-6 w-6 text-yellow-500 mr-2" />
                Popular Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {popularArticles.map((article, index) => (
                  <Link key={index} href={`/help/articles/${article.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900 line-clamp-2">{article.title}</h3>
                          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs mr-2">
                            {article.category}
                          </span>
                          <Clock className="h-3 w-3 mr-1" />
                          {article.time}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Help Categories */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {searchQuery ? `Search Results for "${searchQuery}"` : "Browse by Category"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((category) => (
                <Card key={category.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center mb-2">
                      <div className={`p-2 rounded-lg ${category.color} text-white mr-3`}>
                        {category.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.title}</CardTitle>
                      </div>
                    </div>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {category.articles.slice(0, 3).map((article, index) => (
                        <Link 
                          key={index} 
                          href={`/help/articles/${article.title.toLowerCase().replace(/\s+/g, '-')}`}
                          className="block"
                        >
                          <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900">{article.title}</span>
                              {article.popular && (
                                <Star className="h-3 w-3 text-yellow-500 ml-1" />
                              )}
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {article.time}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <Link href={`/help/category/${category.id}`}>
                      <Button variant="outline" className="w-full mt-4">
                        View All Articles
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Contact Support CTA */}
          <div className="mt-12 text-center">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Still need help?
                </h3>
                <p className="text-gray-600 mb-4">
                  Can&apos;t find what you&apos;re looking for? Our support team is here to help.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/help/contact">
                    <Button className="w-full sm:w-auto">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Support
                    </Button>
                  </Link>
                  <Link href="/help/community">
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Users className="h-4 w-4 mr-2" />
                      Join Community
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
} 