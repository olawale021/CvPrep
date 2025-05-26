"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  Eye,
  Heart,
  Info,
  MessageSquare,
  Share2,
  ThumbsUp
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "../../../../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/Card";
import Sidebar from "../../../../components/ui/Sidebar";

// Types
interface ArticleContentItem {
  type: string;
  content?: string;
  title?: string;
  items?: string[];
  subsections?: Array<{ title: string; content: string }>;
  variant?: string;
}

// Sample article data - in a real app, this would come from a CMS or API
const articles = {
  "how-resume-scoring-works": {
    title: "How Resume Scoring Works",
    category: "Resume Optimizer",
    readTime: "4 min read",
    views: 1247,
    lastUpdated: "2024-01-15",
    author: "CareerPal Team",
    content: [
      {
        type: "intro",
        content: "Understanding how CareerPal scores your resume can help you optimize it more effectively. Our AI-powered scoring system analyzes multiple factors to give you a comprehensive assessment."
      },
      {
        type: "section",
        title: "What Gets Scored",
        content: "Our scoring algorithm evaluates several key areas of your resume:",
        items: [
          "**Keyword Matching**: How well your resume matches the job description keywords",
          "**Skills Alignment**: Relevance of your skills to the position requirements",
          "**Experience Relevance**: How your work history relates to the target role",
          "**Education Match**: Educational background alignment with job requirements",
          "**Format & Structure**: Resume organization and readability",
          "**ATS Compatibility**: How well your resume works with Applicant Tracking Systems"
        ]
      },
      {
        type: "callout",
        variant: "info",
        title: "Pro Tip",
        content: "Focus on the areas with the lowest scores first - these typically offer the biggest improvement opportunities."
      },
      {
        type: "section",
        title: "Scoring Breakdown",
        content: "Each section of your resume receives a score from 0-100:",
        subsections: [
          {
            title: "90-100: Excellent",
            content: "Your resume strongly matches the job requirements in this area."
          },
          {
            title: "70-89: Good",
            content: "Solid match with room for minor improvements."
          },
          {
            title: "50-69: Fair",
            content: "Moderate match - consider adding relevant keywords or experience."
          },
          {
            title: "Below 50: Needs Improvement",
            content: "Significant gaps that should be addressed for better results."
          }
        ]
      },
      {
        type: "section",
        title: "How to Improve Your Score",
        content: "Here are the most effective ways to boost your resume score:",
        items: [
          "**Add relevant keywords** from the job description naturally throughout your resume",
          "**Quantify achievements** with specific numbers and metrics",
          "**Tailor your experience** to highlight the most relevant roles and responsibilities",
          "**Update your skills section** to include technologies and tools mentioned in the job posting",
          "**Optimize formatting** for both human readers and ATS systems",
          "**Include relevant certifications** and training that match job requirements"
        ]
      },
      {
        type: "callout",
        variant: "warning",
        title: "Important Note",
        content: "While scoring is important, remember that a high score doesn't guarantee an interview. Use it as a guide to improve your resume's relevance and visibility."
      }
    ],
    relatedArticles: [
      { title: "Understanding Your Score", slug: "understanding-your-score" },
      { title: "Optimizing Your Resume", slug: "optimizing-your-resume" },
      { title: "ATS-Friendly Formatting", slug: "ats-friendly-formatting" }
    ]
  },
  "how-to-score-90+-on-resume-optimization": {
    title: "How to Score 90+ on Resume Optimization",
    category: "Resume Optimizer",
    readTime: "5 min read",
    views: 3421,
    lastUpdated: "2024-01-20",
    author: "CareerPal Team",
    content: [
      {
        type: "intro",
        content: "Achieving a 90+ score on resume optimization requires strategic thinking and attention to detail. This guide will show you the exact steps to maximize your resume's effectiveness."
      },
      {
        type: "section",
        title: "The 90+ Score Strategy",
        content: "To achieve the highest scores, focus on these critical areas:",
        items: [
          "**Perfect keyword density** - Include 8-12 relevant keywords naturally throughout",
          "**Quantified achievements** - Every bullet point should include numbers or percentages",
          "**Skills-experience alignment** - Match your skills section exactly to job requirements",
          "**ATS optimization** - Use standard formatting and avoid graphics or tables",
          "**Industry-specific language** - Use terminology that hiring managers expect"
        ]
      },
      {
        type: "callout",
        variant: "success",
        title: "Pro Strategy",
        content: "Copy the exact job title and key phrases from the job description into your resume where relevant. This dramatically improves keyword matching scores."
      },
      {
        type: "section",
        title: "Advanced Optimization Techniques",
        content: "These advanced strategies can push your score from good to excellent:",
        subsections: [
          {
            title: "Keyword Placement Strategy",
            content: "Place the most important keywords in your professional summary, skills section, and first bullet point of each job."
          },
          {
            title: "Achievement Formula",
            content: "Use the formula: Action Verb + Specific Task + Quantified Result + Business Impact."
          },
          {
            title: "Skills Section Optimization",
            content: "List skills in order of importance to the role, using exact terminology from the job posting."
          }
        ]
      }
    ],
    relatedArticles: [
      { title: "How Resume Scoring Works", slug: "how-resume-scoring-works" },
      { title: "Understanding Your Score", slug: "understanding-your-score" },
      { title: "Common Resume Mistakes", slug: "common-resume-mistakes" }
    ]
  },
  "creating-your-account": {
    title: "Creating Your Account",
    category: "Getting Started",
    readTime: "2 min read",
    views: 2156,
    lastUpdated: "2024-01-10",
    author: "CareerPal Team",
    content: [
      {
        type: "intro",
        content: "Getting started with CareerPal is quick and easy. Follow these simple steps to create your account and begin optimizing your job search."
      },
      {
        type: "section",
        title: "Step 1: Sign Up",
        content: "Visit the CareerPal homepage and click the 'Sign Up' button. You can create an account using:",
        items: [
          "**Email and password** - Create a new account with your email",
          "**Google account** - Sign up quickly using your Google credentials",
          "**LinkedIn account** - Connect with your professional profile"
        ]
      },
      {
        type: "callout",
        variant: "success",
        title: "Quick Setup",
        content: "Using Google or LinkedIn sign-up can automatically populate some of your profile information."
      },
      {
        type: "section",
        title: "Step 2: Verify Your Email",
        content: "After signing up, check your email for a verification link. Click the link to activate your account."
      },
      {
        type: "section",
        title: "Step 3: Complete Your Profile",
        content: "Add your basic information to get personalized recommendations:",
        items: [
          "Full name and professional title",
          "Industry and experience level",
          "Career goals and preferences",
          "Location and job search radius"
        ]
      }
    ],
    relatedArticles: [
      { title: "Dashboard Overview", slug: "dashboard-overview" },
      { title: "Uploading Your First Resume", slug: "uploading-your-first-resume" },
      { title: "Account Settings", slug: "account-settings" }
    ]
  },
  "top-10-interview-questions-and-how-to-answer-them": {
    title: "Top 10 Interview Questions and How to Answer Them",
    category: "Interview Prep",
    readTime: "8 min read",
    views: 4892,
    lastUpdated: "2024-01-18",
    author: "CareerPal Team",
    content: [
      {
        type: "intro",
        content: "Master the most common interview questions with proven answer frameworks and real examples that will help you stand out from other candidates."
      },
      {
        type: "section",
        title: "The STAR Method",
        content: "Before diving into specific questions, understand the STAR method for behavioral questions:",
        items: [
          "**Situation** - Set the context for your story",
          "**Task** - Describe what you needed to accomplish",
          "**Action** - Explain the specific steps you took",
          "**Result** - Share the outcome and what you learned"
        ]
      },
      {
        type: "section",
        title: "Top 10 Questions & Answers",
        content: "Here are the most frequently asked questions and how to answer them effectively:",
        subsections: [
          {
            title: "1. Tell me about yourself",
            content: "Focus on your professional journey, key achievements, and what makes you perfect for this role. Keep it to 2-3 minutes."
          },
          {
            title: "2. Why do you want this job?",
            content: "Connect your career goals with the company's mission and show how this role fits your long-term plans."
          },
          {
            title: "3. What are your strengths?",
            content: "Choose 2-3 strengths that directly relate to the job requirements and provide specific examples."
          },
          {
            title: "4. What are your weaknesses?",
            content: "Share a real weakness but explain how you're actively working to improve it."
          },
          {
            title: "5. Where do you see yourself in 5 years?",
            content: "Show ambition while demonstrating commitment to growing within the company."
          }
        ]
      },
      {
        type: "callout",
        variant: "info",
        title: "Practice Tip",
        content: "Record yourself answering these questions and time your responses. Aim for 1-2 minutes per answer for most questions."
      }
    ],
    relatedArticles: [
      { title: "Interview Preparation Basics", slug: "interview-preparation-basics" },
      { title: "Behavioral Interview Strategies", slug: "behavioral-interview-strategies" },
      { title: "Technical Interview Tips", slug: "technical-interview-tips" }
    ]
  },
  "writing-cover-letters-that-get-noticed": {
    title: "Writing Cover Letters That Get Noticed",
    category: "Cover Letters",
    readTime: "6 min read",
    views: 2847,
    lastUpdated: "2024-01-16",
    author: "CareerPal Team",
    content: [
      {
        type: "intro",
        content: "A compelling cover letter can be the difference between getting an interview and being overlooked. Learn how to write cover letters that capture attention and showcase your value."
      },
      {
        type: "section",
        title: "Cover Letter Structure",
        content: "Every effective cover letter follows this proven structure:",
        items: [
          "**Opening hook** - Start with something that grabs attention",
          "**Value proposition** - Explain what you bring to the role",
          "**Specific examples** - Provide concrete evidence of your abilities",
          "**Company connection** - Show you've researched the company",
          "**Strong closing** - End with a clear call to action"
        ]
      },
      {
        type: "callout",
        variant: "warning",
        title: "Common Mistake",
        content: "Never start with 'I am writing to apply for...' - it's boring and immediately signals a generic letter."
      },
      {
        type: "section",
        title: "Writing Tips That Work",
        content: "These strategies will make your cover letter stand out:",
        subsections: [
          {
            title: "Research the Company",
            content: "Mention specific company initiatives, recent news, or values that resonate with you."
          },
          {
            title: "Quantify Your Impact",
            content: "Use numbers and percentages to demonstrate your achievements and potential value."
          },
          {
            title: "Match the Tone",
            content: "Adapt your writing style to match the company culture - formal for traditional industries, casual for startups."
          },
          {
            title: "Address Pain Points",
            content: "Identify challenges the company faces and explain how you can help solve them."
          }
        ]
      }
    ],
    relatedArticles: [
      { title: "Cover Letter Templates", slug: "cover-letter-templates" },
      { title: "Customizing Your Cover Letter", slug: "customizing-your-cover-letter" },
      { title: "Cover Letter Mistakes to Avoid", slug: "cover-letter-mistakes" }
    ]
  },
  "dashboard-overview": {
    title: "Dashboard Overview",
    category: "Getting Started",
    readTime: "3 min read",
    views: 1876,
    lastUpdated: "2024-01-12",
    author: "CareerPal Team",
    content: [
      {
        type: "intro",
        content: "Your CareerPal dashboard is your command center for job search success. Learn how to navigate and use all the features effectively."
      },
      {
        type: "section",
        title: "Dashboard Sections",
        content: "Your dashboard is organized into several key areas:",
        items: [
          "**Quick Stats** - Overview of your resume scores and activity",
          "**Recent Activity** - Your latest optimizations and improvements",
          "**Recommended Actions** - AI-suggested next steps for your job search",
          "**Progress Tracking** - Visual representation of your improvement over time",
          "**Upcoming Interviews** - Schedule and preparation reminders"
        ]
      },
      {
        type: "section",
        title: "Navigation Menu",
        content: "The sidebar provides access to all CareerPal features:",
        subsections: [
          {
            title: "Resume Optimizer",
            content: "Upload, analyze, and optimize your resumes for specific job descriptions."
          },
          {
            title: "Interview Prep",
            content: "Practice with AI-generated questions and get feedback on your answers."
          },
          {
            title: "Cover Letter Generator",
            content: "Create customized cover letters for each application."
          },
          {
            title: "Help Center",
            content: "Access tutorials, FAQs, and support resources."
          }
        ]
      },
      {
        type: "callout",
        variant: "info",
        title: "Pro Tip",
        content: "Check your dashboard daily to stay on top of recommended actions and track your progress toward your job search goals."
      }
    ],
    relatedArticles: [
      { title: "Creating Your Account", slug: "creating-your-account" },
      { title: "Uploading Your First Resume", slug: "uploading-your-first-resume" },
      { title: "Setting Up Your Profile", slug: "setting-up-your-profile" }
    ]
  }
};

const calloutStyles = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  success: "bg-green-50 border-green-200 text-green-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  error: "bg-red-50 border-red-200 text-red-800"
};

const calloutIcons = {
  info: <Info className="h-5 w-5" />,
  success: <CheckCircle className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  error: <AlertTriangle className="h-5 w-5" />
};

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [liked, setLiked] = useState(false);
  const [helpful, setHelpful] = useState<boolean | null>(null);

  const article = articles[slug as keyof typeof articles];

  if (!article) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 pt-16 md:pt-6 overflow-x-hidden">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
            <p className="text-gray-600 mb-6">The article you&lsquo;re looking for doesn&lsquo;t exist.</p>
            <Link href="/help">
              <Button>Back to Help Center</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const renderContent = (item: ArticleContentItem, index: number) => {
    switch (item.type) {
      case "intro":
        return (
          <div key={index} className="text-lg text-gray-700 leading-relaxed mb-8">
            {item.content}
          </div>
        );
      
      case "section":
        return (
          <div key={index} className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{item.title}</h2>
            <p className="text-gray-700 mb-4">{item.content}</p>
            {item.items && (
              <ul className="space-y-2 mb-4">
                {item.items.map((listItem: string, i: number) => (
                  <li key={i} className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-gray-700" dangerouslySetInnerHTML={{ __html: listItem }} />
                  </li>
                ))}
              </ul>
            )}
            {item.subsections && (
              <div className="space-y-4">
                {item.subsections.map((subsection: { title: string; content: string }, i: number) => (
                  <div key={i} className="pl-4 border-l-2 border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">{subsection.title}</h3>
                    <p className="text-gray-700">{subsection.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      case "callout":
        return (
          <div key={index} className={`border rounded-lg p-4 mb-8 ${calloutStyles[item.variant as keyof typeof calloutStyles]}`}>
            <div className="flex items-start">
              <div className="mr-3 flex-shrink-0">
                {calloutIcons[item.variant as keyof typeof calloutIcons]}
              </div>
              <div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p>{item.content}</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

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

          {/* Article Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
                {article.category}
              </span>
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {article.readTime}
                </div>
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {article.views.toLocaleString()} views
                </div>
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                By {article.author} • Updated {new Date(article.lastUpdated).toLocaleDateString()}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLiked(!liked)}
                  className={liked ? "text-red-600 border-red-200" : ""}
                >
                  <Heart className={`h-4 w-4 mr-1 ${liked ? "fill-current" : ""}`} />
                  {liked ? "Liked" : "Like"}
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-8">
            <div className="prose prose-lg max-w-none">
              {article.content.map((item, index) => renderContent(item, index))}
            </div>
          </div>

          {/* Feedback Section */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Was this article helpful?</h3>
              <div className="flex items-center space-x-4 mb-4">
                <Button
                  variant={helpful === true ? "default" : "outline"}
                  onClick={() => setHelpful(true)}
                  className="flex items-center"
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Yes
                </Button>
                <Button
                  variant={helpful === false ? "default" : "outline"}
                  onClick={() => setHelpful(false)}
                  className="flex items-center"
                >
                  <ThumbsUp className="h-4 w-4 mr-2 rotate-180" />
                  No
                </Button>
              </div>
              {helpful !== null && (
                <div className="text-sm text-gray-600">
                  Thank you for your feedback! {helpful ? "We&apos;re glad this helped." : "We&apos;ll work on improving this article."}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Articles */}
          {article.relatedArticles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Related Articles
                </CardTitle>
                <CardDescription>
                  Continue learning with these related topics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {article.relatedArticles.map((related, index) => (
                    <Link key={index} href={`/help/articles/${related.slug}`}>
                      <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all">
                        <h4 className="font-medium text-gray-900 mb-2">{related.title}</h4>
                        <div className="flex items-center text-sm text-blue-600">
                          Read article
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Support CTA */}
          <div className="mt-12 text-center">
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Still have questions?
                </h3>
                <p className="text-gray-600 mb-4">
                  Our support team is here to help you succeed.
                </p>
                <Link href="/help/contact">
                  <Button>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
} 