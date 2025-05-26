"use client";

import {
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    HelpCircle,
    MessageSquare,
    Search,
    Star
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import Sidebar from "../../../components/ui/Sidebar";

const faqCategories = [
  {
    id: "general",
    title: "General Questions",
    icon: <HelpCircle className="h-5 w-5" />,
    questions: [
      {
        question: "What is CareerPal?",
        answer: "CareerPal is an AI-powered job search assistant that helps you optimize your resume, prepare for interviews, and create compelling cover letters. Our platform uses advanced algorithms to analyze job descriptions and provide personalized recommendations to improve your chances of landing your dream job."
      },
      {
        question: "How does the AI scoring work?",
        answer: "Our AI scoring system analyzes your resume against job descriptions using natural language processing and machine learning. It evaluates keyword matching, skills alignment, experience relevance, and ATS compatibility to provide a comprehensive score from 0-100."
      },
      {
        question: "Is my data secure?",
        answer: "Yes, we take data security very seriously. All your personal information and documents are encrypted and stored securely. We never share your data with third parties without your explicit consent, and you can delete your account and data at any time."
      },
      {
        question: "Can I use CareerPal for free?",
        answer: "Yes! CareerPal offers a free tier that includes basic resume scoring and limited optimizations. For unlimited access to all features including advanced AI recommendations, interview prep, and priority support, you can upgrade to our premium plans."
      }
    ]
  },
  {
    id: "resume",
    title: "Resume Optimizer",
    icon: <Star className="h-5 w-5" />,
    questions: [
      {
        question: "What file formats are supported for resume upload?",
        answer: "We support PDF, DOC, and DOCX file formats. For best results, we recommend uploading your resume as a PDF to preserve formatting. The maximum file size is 10MB."
      },
      {
        question: "How accurate is the resume scoring?",
        answer: "Our scoring algorithm is trained on thousands of successful resumes and job descriptions. While scores provide valuable insights, they should be used as guidance rather than absolute measures. A high score increases your chances but doesn't guarantee success."
      },
      {
        question: "Can I optimize my resume for multiple jobs?",
        answer: "Absolutely! You can upload multiple resumes and optimize each one for different job descriptions. We recommend creating targeted versions of your resume for different roles or industries."
      },
      {
        question: "Why is my resume score low?",
        answer: "Low scores typically indicate misalignment between your resume and the job description. Common issues include missing keywords, irrelevant experience, poor formatting, or lack of quantified achievements. Use our optimization suggestions to improve your score."
      },
      {
        question: "How do I download my optimized resume?",
        answer: "After optimization, click the 'Download' button in the top-right corner of the optimized resume view. You can download in PDF format, which preserves all formatting and is ready for job applications."
      }
    ]
  },
  {
    id: "interview",
    title: "Interview Preparation",
    icon: <MessageSquare className="h-5 w-5" />,
    questions: [
      {
        question: "How are interview questions generated?",
        answer: "Our AI analyzes the job description, your resume, and industry standards to generate relevant interview questions. Questions are categorized into technical, behavioral, situational, role-specific, and culture-fit categories."
      },
      {
        question: "Can I practice with custom questions?",
        answer: "Yes! You can add your own questions to the practice simulation or modify the generated questions. This is helpful for preparing for specific company interviews or addressing particular concerns."
      },
      {
        question: "How is my interview performance evaluated?",
        answer: "Our AI evaluates your answers based on relevance, structure, specific examples, and alignment with best practices. You'll receive detailed feedback on strengths, areas for improvement, and better answer examples."
      },
      {
        question: "Can I retake interview simulations?",
        answer: "Yes, you can practice as many times as you want. Each simulation provides fresh insights and helps you improve your interview skills progressively."
      }
    ]
  },
  {
    id: "technical",
    title: "Technical Support",
    icon: <HelpCircle className="h-5 w-5" />,
    questions: [
      {
        question: "Why can't I upload my resume?",
        answer: "Upload issues are usually caused by file size (max 10MB), unsupported format, or browser issues. Try converting to PDF, reducing file size, or using a different browser. Clear your browser cache if problems persist."
      },
      {
        question: "The website is loading slowly. What should I do?",
        answer: "Slow loading can be caused by internet connection, browser cache, or high server traffic. Try refreshing the page, clearing your browser cache, or using a different browser. If issues persist, contact our support team."
      },
      {
        question: "I'm getting error messages. How do I fix them?",
        answer: "Note the exact error message and try refreshing the page. If the error persists, try logging out and back in, clearing your browser cache, or using an incognito/private browsing window. Contact support if issues continue."
      },
      {
        question: "Which browsers are supported?",
        answer: "CareerPal works best on modern browsers including Chrome (recommended), Firefox, Safari, and Edge. Make sure your browser is updated to the latest version for optimal performance."
      }
    ]
  },
  {
    id: "account",
    title: "Account & Billing",
    icon: <HelpCircle className="h-5 w-5" />,
    questions: [
      {
        question: "How do I reset my password?",
        answer: "Click &apos;Forgot Password&apos; on the login page and enter your email address. You&apos;ll receive a password reset link within a few minutes. Check your spam folder if you don&apos;t see the email."
      },
      {
        question: "Can I change my email address?",
        answer: "Yes, you can update your email address in Account Settings. You&apos;ll need to verify the new email address before the change takes effect."
      },
      {
        question: "How do I cancel my subscription?",
        answer: "You can cancel your subscription anytime in Account Settings under the Billing section. Your access will continue until the end of your current billing period."
      },
      {
        question: "Do you offer refunds?",
        answer: "We offer a 30-day money-back guarantee for premium subscriptions. If you&apos;re not satisfied, contact our support team within 30 days of purchase for a full refund."
      },
      {
        question: "How do I delete my account?",
        answer: "To delete your account, go to Account Settings and click &apos;Delete Account&apos;. This action is permanent and will remove all your data. Make sure to download any important documents before deletion."
      }
    ]
  }
];

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const allQuestions = faqCategories.flatMap(category => 
    category.questions.map(q => ({ ...q, category: category.title }))
  );

  const searchResults = searchQuery 
    ? allQuestions.filter(q => 
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 pt-16 md:pt-6 overflow-x-hidden">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link href="/help" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Help Center
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h1>
            <p className="text-lg text-gray-600">
              Find quick answers to common questions about CareerPal
            </p>
          </div>

          {/* Search */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search frequently asked questions..."
                className="pl-12 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Search Results ({searchResults.length})
              </h2>
              {searchResults.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{item.question}</h3>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium ml-4 flex-shrink-0">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-600 mb-4">
                      We couldn&apos;t find any questions matching your search. Try different keywords or browse categories below.
                    </p>
                    <Link href="/help/contact">
                      <Button>Contact Support</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* FAQ Categories */}
          {!searchQuery && (
            <div className="space-y-6">
              {filteredCategories.map((category) => (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        {category.icon}
                      </div>
                      {category.title}
                    </CardTitle>
                    <CardDescription>
                      {category.questions.length} question{category.questions.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {category.questions.map((item, index) => {
                        const itemId = `${category.id}-${index}`;
                        const isExpanded = expandedItems.includes(itemId);
                        
                        return (
                          <div key={index} className="border border-gray-200 rounded-lg">
                            <button
                              onClick={() => toggleExpanded(itemId)}
                              className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                              <span className="font-medium text-gray-900 pr-4">{item.question}</span>
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                              )}
                            </button>
                            {isExpanded && (
                              <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                                <p className="text-gray-700 leading-relaxed pt-4">{item.answer}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Contact Support CTA */}
          <div className="mt-12 text-center">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Didn&apos;t find what you&apos;re looking for?
                </h3>
                <p className="text-gray-600 mb-4">
                  Our support team is ready to help with any questions not covered here.
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