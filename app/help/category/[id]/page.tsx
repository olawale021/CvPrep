"use client";

import {
    ArrowLeft,
    BookOpen,
    ChevronRight,
    Clock,
    Eye,
    Star
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "../../../../components/ui/Button";
import { Card, CardContent } from "../../../../components/ui/Card";
import Sidebar from "../../../../components/ui/Sidebar";

// Category data with all articles
const categoryData = {
  "getting-started": {
    title: "Getting Started",
    description: "Learn the basics of CareerPal and set up your account for success",
    icon: "📚",
    color: "bg-blue-500",
    articles: [
      {
        title: "Creating Your Account",
        slug: "creating-your-account",
        description: "Step-by-step guide to setting up your CareerPal account",
        readTime: "2 min read",
        views: 2156,
        popular: true,
        difficulty: "Beginner"
      },
      {
        title: "Dashboard Overview",
        slug: "dashboard-overview",
        description: "Navigate your CareerPal dashboard like a pro",
        readTime: "3 min read",
        views: 1876,
        popular: true,
        difficulty: "Beginner"
      },
      {
        title: "Uploading Your First Resume",
        slug: "uploading-your-first-resume",
        description: "Learn how to upload and manage your resume files",
        readTime: "2 min read",
        views: 1543,
        popular: false,
        difficulty: "Beginner"
      },
      {
        title: "Account Settings",
        slug: "account-settings",
        description: "Customize your account preferences and privacy settings",
        readTime: "2 min read",
        views: 987,
        popular: false,
        difficulty: "Beginner"
      }
    ]
  },
  "resume-optimizer": {
    title: "Resume Optimizer",
    description: "Master the resume optimization features and boost your scores",
    icon: "📄",
    color: "bg-green-500",
    articles: [
      {
        title: "How Resume Scoring Works",
        slug: "how-resume-scoring-works",
        description: "Understand the AI algorithm behind resume scoring",
        readTime: "4 min read",
        views: 1247,
        popular: true,
        difficulty: "Intermediate"
      },
      {
        title: "How to Score 90+ on Resume Optimization",
        slug: "how-to-score-90+-on-resume-optimization",
        description: "Advanced strategies for achieving the highest scores",
        readTime: "5 min read",
        views: 3421,
        popular: true,
        difficulty: "Advanced"
      },
      {
        title: "Understanding Your Score",
        slug: "understanding-your-score",
        description: "Interpret your resume scores and improvement suggestions",
        readTime: "3 min read",
        views: 2134,
        popular: true,
        difficulty: "Beginner"
      },
      {
        title: "Optimizing Your Resume",
        slug: "optimizing-your-resume",
        description: "Step-by-step optimization process for better results",
        readTime: "5 min read",
        views: 1876,
        popular: true,
        difficulty: "Intermediate"
      },
      {
        title: "Downloading Optimized Resumes",
        slug: "downloading-optimized-resumes",
        description: "Export your optimized resume in various formats",
        readTime: "2 min read",
        views: 1234,
        popular: false,
        difficulty: "Beginner"
      }
    ]
  },
  "interview-prep": {
    title: "Interview Preparation",
    description: "Get ready for interviews with AI-powered practice and feedback",
    icon: "🎓",
    color: "bg-purple-500",
    articles: [
      {
        title: "Top 10 Interview Questions and How to Answer Them",
        slug: "top-10-interview-questions-and-how-to-answer-them",
        description: "Master the most common interview questions with proven strategies",
        readTime: "8 min read",
        views: 4892,
        popular: true,
        difficulty: "Intermediate"
      },
      {
        title: "Generating Interview Questions",
        slug: "generating-interview-questions",
        description: "Use AI to create personalized interview questions",
        readTime: "3 min read",
        views: 2341,
        popular: true,
        difficulty: "Beginner"
      },
      {
        title: "Practice Simulations",
        slug: "practice-simulations",
        description: "Conduct realistic interview practice sessions",
        readTime: "4 min read",
        views: 1987,
        popular: true,
        difficulty: "Intermediate"
      },
      {
        title: "Understanding Feedback",
        slug: "understanding-feedback",
        description: "Interpret AI feedback to improve your interview skills",
        readTime: "3 min read",
        views: 1654,
        popular: false,
        difficulty: "Beginner"
      },
      {
        title: "Tips for Better Answers",
        slug: "tips-for-better-answers",
        description: "Advanced techniques for compelling interview responses",
        readTime: "5 min read",
        views: 1432,
        popular: false,
        difficulty: "Advanced"
      }
    ]
  },
  "cover-letters": {
    title: "Cover Letters",
    description: "Create compelling cover letters that get you noticed",
    icon: "💌",
    color: "bg-orange-500",
    articles: [
      {
        title: "Writing Cover Letters That Get Noticed",
        slug: "writing-cover-letters-that-get-noticed",
        description: "Craft compelling cover letters that stand out",
        readTime: "6 min read",
        views: 2847,
        popular: true,
        difficulty: "Intermediate"
      },
      {
        title: "Generating Cover Letters",
        slug: "generating-cover-letters",
        description: "Use AI to create personalized cover letters",
        readTime: "3 min read",
        views: 2156,
        popular: true,
        difficulty: "Beginner"
      },
      {
        title: "Customizing Your Letter",
        slug: "customizing-your-letter",
        description: "Tailor your cover letter for specific job applications",
        readTime: "4 min read",
        views: 1789,
        popular: false,
        difficulty: "Intermediate"
      },
      {
        title: "Best Practices",
        slug: "best-practices",
        description: "Industry-proven cover letter writing strategies",
        readTime: "5 min read",
        views: 1543,
        popular: true,
        difficulty: "Intermediate"
      },
      {
        title: "Common Mistakes to Avoid",
        slug: "common-mistakes-to-avoid",
        description: "Avoid these cover letter pitfalls that hurt your chances",
        readTime: "4 min read",
        views: 1321,
        popular: false,
        difficulty: "Beginner"
      }
    ]
  },
  "troubleshooting": {
    title: "Troubleshooting",
    description: "Solve common issues and get technical support",
    icon: "🔧",
    color: "bg-red-500",
    articles: [
      {
        title: "File Upload Issues",
        slug: "file-upload-issues",
        description: "Resolve problems with uploading resume files",
        readTime: "2 min read",
        views: 1876,
        popular: true,
        difficulty: "Beginner"
      },
      {
        title: "Login Problems",
        slug: "login-problems",
        description: "Fix account access and authentication issues",
        readTime: "2 min read",
        views: 1654,
        popular: true,
        difficulty: "Beginner"
      },
      {
        title: "Performance Issues",
        slug: "performance-issues",
        description: "Troubleshoot slow loading and performance problems",
        readTime: "3 min read",
        views: 1234,
        popular: false,
        difficulty: "Intermediate"
      },
      {
        title: "Browser Compatibility",
        slug: "browser-compatibility",
        description: "Ensure CareerPal works properly in your browser",
        readTime: "2 min read",
        views: 987,
        popular: false,
        difficulty: "Beginner"
      }
    ]
  },
  "community": {
    title: "Community & Support",
    description: "Connect with other users and get help from our team",
    icon: "👥",
    color: "bg-indigo-500",
    articles: [
      {
        title: "Community Guidelines",
        slug: "community-guidelines",
        description: "Rules and best practices for community participation",
        readTime: "3 min read",
        views: 876,
        popular: false,
        difficulty: "Beginner"
      },
      {
        title: "Contacting Support",
        slug: "contacting-support",
        description: "How to get help from our support team",
        readTime: "2 min read",
        views: 1543,
        popular: true,
        difficulty: "Beginner"
      },
      {
        title: "Feature Requests",
        slug: "feature-requests",
        description: "Submit ideas for new CareerPal features",
        readTime: "2 min read",
        views: 654,
        popular: false,
        difficulty: "Beginner"
      },
      {
        title: "Success Stories",
        slug: "success-stories",
        description: "Read inspiring stories from CareerPal users",
        readTime: "5 min read",
        views: 2341,
        popular: true,
        difficulty: "Beginner"
      }
    ]
  }
};

const difficultyColors = {
  "Beginner": "bg-green-100 text-green-800",
  "Intermediate": "bg-yellow-100 text-yellow-800",
  "Advanced": "bg-red-100 text-red-800"
};

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.id as string;
  const category = categoryData[categoryId as keyof typeof categoryData];

  if (!category) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 pt-16 md:pt-6 overflow-x-hidden">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h1>
            <p className="text-gray-600 mb-6">The category you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/help">
              <Button>Back to Help Center</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const popularArticles = category.articles.filter(article => article.popular);
  const allArticles = category.articles;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 pt-16 md:pt-6 overflow-x-hidden">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link href="/help" className="inline-flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Help Center
            </Link>
          </div>

          {/* Category Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className={`p-3 rounded-lg ${category.color} text-white mr-4 text-2xl`}>
                {category.icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{category.title}</h1>
                <p className="text-lg text-gray-600 mt-1">{category.description}</p>
              </div>
            </div>
            
            <div className="flex items-center text-sm text-gray-500 space-x-4">
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 mr-1" />
                {allArticles.length} article{allArticles.length !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1" />
                {popularArticles.length} popular
              </div>
            </div>
          </div>

          {/* Popular Articles */}
          {popularArticles.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Star className="h-6 w-6 text-yellow-500 mr-2" />
                Popular in {category.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {popularArticles.map((article, index) => (
                  <Link key={index} href={`/help/articles/${article.slug}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">
                            {article.title}
                          </h3>
                          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {article.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[article.difficulty as keyof typeof difficultyColors]}`}>
                              {article.difficulty}
                            </span>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {article.readTime}
                            </div>
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <Eye className="h-3 w-3 mr-1" />
                            {article.views.toLocaleString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* All Articles */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              All {category.title} Articles
            </h2>
            <div className="space-y-4">
              {allArticles.map((article, index) => (
                <Link key={index} href={`/help/articles/${article.slug}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 mr-4">
                          <div className="flex items-center mb-2">
                            <h3 className="font-semibold text-gray-900 mr-2">
                              {article.title}
                            </h3>
                            {article.popular && (
                              <Star className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            {article.description}
                          </p>
                          <div className="flex items-center space-x-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[article.difficulty as keyof typeof difficultyColors]}`}>
                              {article.difficulty}
                            </span>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {article.readTime}
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <Eye className="h-3 w-3 mr-1" />
                              {article.views.toLocaleString()} views
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Back to Help Center */}
          <div className="mt-12 text-center">
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Need more help?
                </h3>
                <p className="text-gray-600 mb-4">
                  Explore other categories or contact our support team.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/help">
                    <Button variant="outline" className="w-full sm:w-auto">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Browse All Categories
                    </Button>
                  </Link>
                  <Link href="/help/contact">
                    <Button className="w-full sm:w-auto">
                      Contact Support
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