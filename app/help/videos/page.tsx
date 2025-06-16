"use client";

import {
    ArrowLeft,
    BookOpen,
    Clock,
    Eye,
    FileText,
    Filter,
    GraduationCap,
    MessageSquare,
    Play,
    Search,
    Star
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../../../components/ui/base/Button";
import { Card, CardContent } from "../../../components/ui/base/Card";
import { Input } from "../../../components/ui/base/Input";
import Sidebar from "../../../components/layout/Sidebar";

const videoCategories = [
  { id: "all", title: "All Videos", icon: <BookOpen className="h-4 w-4" /> },
  { id: "getting-started", title: "Getting Started", icon: <BookOpen className="h-4 w-4" /> },
  { id: "resume", title: "Resume Optimizer", icon: <FileText className="h-4 w-4" /> },
  { id: "interview", title: "Interview Prep", icon: <GraduationCap className="h-4 w-4" /> },
  { id: "cover-letter", title: "Cover Letters", icon: <MessageSquare className="h-4 w-4" /> }
];

const videos = [
  {
    id: "1",
    title: "Getting Started with CareerPal",
    description: "Learn the basics of CareerPal and how to set up your account for success.",
    category: "getting-started",
    duration: "3:45",
    views: 12500,
    thumbnail: "/api/placeholder/400/225",
    featured: true,
    difficulty: "Beginner"
  },
  {
    id: "2",
    title: "How to Upload and Optimize Your Resume",
    description: "Step-by-step guide to uploading your resume and using our optimization features.",
    category: "resume",
    duration: "5:20",
    views: 8900,
    thumbnail: "/api/placeholder/400/225",
    featured: true,
    difficulty: "Beginner"
  },
  {
    id: "3",
    title: "Understanding Your Resume Score",
    description: "Deep dive into how our AI scoring works and how to interpret your results.",
    category: "resume",
    duration: "4:15",
    views: 6700,
    thumbnail: "/api/placeholder/400/225",
    featured: false,
    difficulty: "Intermediate"
  },
  {
    id: "4",
    title: "Advanced Resume Optimization Techniques",
    description: "Pro tips for getting the highest possible score on your resume optimization.",
    category: "resume",
    duration: "7:30",
    views: 4200,
    thumbnail: "/api/placeholder/400/225",
    featured: false,
    difficulty: "Advanced"
  },
  {
    id: "5",
    title: "Interview Preparation Basics",
    description: "Learn how to use our interview prep tools to practice and improve your skills.",
    category: "interview",
    duration: "6:10",
    views: 5800,
    thumbnail: "/api/placeholder/400/225",
    featured: true,
    difficulty: "Beginner"
  },
  {
    id: "6",
    title: "Mastering Behavioral Interview Questions",
    description: "Advanced strategies for answering behavioral questions with confidence.",
    category: "interview",
    duration: "8:45",
    views: 3900,
    thumbnail: "/api/placeholder/400/225",
    featured: false,
    difficulty: "Intermediate"
  },
  {
    id: "7",
    title: "Creating Compelling Cover Letters",
    description: "Learn how to generate and customize cover letters that get noticed.",
    category: "cover-letter",
    duration: "4:50",
    views: 7100,
    thumbnail: "/api/placeholder/400/225",
    featured: false,
    difficulty: "Beginner"
  },
  {
    id: "8",
    title: "Dashboard Overview and Navigation",
    description: "Complete tour of the CareerPal dashboard and all its features.",
    category: "getting-started",
    duration: "3:20",
    views: 9200,
    thumbnail: "/api/placeholder/400/225",
    featured: false,
    difficulty: "Beginner"
  }
];

const difficultyColors = {
  "Beginner": "bg-green-100 text-green-800",
  "Intermediate": "bg-yellow-100 text-yellow-800",
  "Advanced": "bg-red-100 text-red-800"
};

export default function VideoTutorials() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVideos = videos.filter(video => {
    const matchesCategory = selectedCategory === "all" || video.category === selectedCategory;
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredVideos = videos.filter(video => video.featured);

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Tutorials</h1>
            <p className="text-lg text-gray-600">
              Learn CareerPal with step-by-step video guides
            </p>
          </div>

          {/* Search and Filter */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search video tutorials..."
                  className="pl-12 pr-4 py-3 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <div className="flex flex-wrap gap-2">
                  {videoCategories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className="flex items-center"
                    >
                      {category.icon}
                      <span className="ml-1">{category.title}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Featured Videos */}
          {selectedCategory === "all" && !searchQuery && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Star className="h-6 w-6 text-yellow-500 mr-2" />
                Featured Tutorials
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredVideos.map((video) => (
                  <Card key={video.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                    <div className="relative">
                      <div className="aspect-video bg-gray-200 rounded-t-lg relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <Play className="h-12 w-12 text-white group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                          {video.duration}
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[video.difficulty as keyof typeof difficultyColors]}`}>
                          {video.difficulty}
                        </span>
                        <div className="flex items-center text-sm text-gray-500">
                          <Eye className="h-3 w-3 mr-1" />
                          {video.views.toLocaleString()}
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{video.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{video.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* All Videos */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {searchQuery ? `Search Results (${filteredVideos.length})` : 
               selectedCategory === "all" ? "All Tutorials" : 
               videoCategories.find(cat => cat.id === selectedCategory)?.title}
            </h2>
            
            {filteredVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVideos.map((video) => (
                  <Card key={video.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                    <div className="relative">
                      <div className="aspect-video bg-gray-200 rounded-t-lg relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <Play className="h-12 w-12 text-white group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                          {video.duration}
                        </div>
                        {video.featured && (
                          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                            Featured
                          </div>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[video.difficulty as keyof typeof difficultyColors]}`}>
                          {video.difficulty}
                        </span>
                        <div className="flex items-center text-sm text-gray-500">
                          <Eye className="h-3 w-3 mr-1" />
                          {video.views.toLocaleString()}
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{video.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{video.description}</p>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 capitalize">
                            {videoCategories.find(cat => cat.id === video.category)?.title}
                          </span>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {video.duration}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No videos found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery 
                      ? "Try different search terms or browse by category."
                      : "No videos available in this category yet."}
                  </p>
                  <Button onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}>
                    View All Videos
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Learning Path Suggestion */}
          <div className="mt-12">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Suggested Learning Path
                </h3>
                <p className="text-gray-600 mb-4">
                  New to CareerPal? Follow this recommended sequence for the best learning experience.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">1</div>
                    <p className="text-sm font-medium text-gray-900">Getting Started</p>
                    <p className="text-xs text-gray-600">Account setup & basics</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">2</div>
                    <p className="text-sm font-medium text-gray-900">Resume Upload</p>
                    <p className="text-xs text-gray-600">Upload & optimize</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">3</div>
                    <p className="text-sm font-medium text-gray-900">Interview Prep</p>
                    <p className="text-xs text-gray-600">Practice & improve</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">4</div>
                    <p className="text-sm font-medium text-gray-900">Cover Letters</p>
                    <p className="text-xs text-gray-600">Create & customize</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Support CTA */}
          <div className="mt-12 text-center">
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Need more help?
                </h3>
                <p className="text-gray-600 mb-4">
                  Can&apos;t find the video you&apos;re looking for? Our support team can help.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/help/contact">
                    <Button className="w-full sm:w-auto">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Support
                    </Button>
                  </Link>
                  <Link href="/help">
                    <Button variant="outline" className="w-full sm:w-auto">
                      Browse Help Articles
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