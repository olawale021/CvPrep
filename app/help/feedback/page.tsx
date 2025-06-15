"use client";

import {
    ArrowLeft,
    CheckCircle,
    Lightbulb,
    MessageSquare,
    Send,
    Star,
    ThumbsUp
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { LoadingButton } from "../../../components/ui/LoadingButton";
import Sidebar from "../../../components/ui/Sidebar";
import { Textarea } from "../../../components/ui/Textarea";
import TicketId from "../../../components/ui/TicketId";

const feedbackTypes = [
  {
    id: "feature",
    title: "Feature Request",
    description: "Suggest new features or improvements",
    icon: <Lightbulb className="h-6 w-6" />,
    color: "bg-yellow-500"
  },
  {
    id: "improvement",
    title: "Improvement Suggestion",
    description: "Ideas to enhance existing features",
    icon: <ThumbsUp className="h-6 w-6" />,
    color: "bg-blue-500"
  },
  {
    id: "general",
    title: "General Feedback",
    description: "Share your thoughts about CareerPal",
    icon: <MessageSquare className="h-6 w-6" />,
    color: "bg-green-500"
  }
];

const popularRequests = [
  {
    title: "Mobile App",
    description: "Native mobile app for iOS and Android",
    votes: 247,
    status: "In Development"
  },
  {
    title: "Resume Templates",
    description: "More professional resume templates",
    votes: 189,
    status: "Planned"
  },
  {
    title: "LinkedIn Integration",
    description: "Import profile data from LinkedIn",
    votes: 156,
    status: "Under Review"
  },
  {
    title: "Salary Insights",
    description: "Salary ranges for different positions",
    votes: 134,
    status: "Planned"
  },
  {
    title: "Team Collaboration",
    description: "Share resumes with team members",
    votes: 98,
    status: "Under Review"
  }
];

export default function FeedbackPage() {
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    description: "",
    email: "",
    priority: "medium"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 pt-16 md:pt-6 overflow-x-hidden">
          <div className="max-w-2xl mx-auto">
            <Card className="text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Thank You for Your Feedback!
                </h1>
                <p className="text-gray-600 mb-6">
                  We&apos;ve received your suggestion and our team will review it carefully. 
                  We&apos;ll keep you updated on its progress.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600">
                    <strong>Request ID:</strong> <TicketId prefix="FR" />
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Title:</strong> {formData.title}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/help">
                    <Button variant="outline">
                      Back to Help Center
                    </Button>
                  </Link>
                  <Button onClick={() => setSubmitted(false)}>
                    Submit Another Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Feature Requests & Feedback</h1>
            <p className="text-lg text-gray-600">
              Help us improve CareerPal by sharing your ideas and suggestions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Popular Requests */}
            <div className="lg:col-span-1">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Popular Requests</h2>
              <div className="space-y-4">
                {popularRequests.map((request, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 text-sm">{request.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          request.status === 'In Development' ? 'bg-blue-100 text-blue-800' :
                          request.status === 'Planned' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-3">{request.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-500">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {request.votes} votes
                        </div>
                        <Button size="sm" variant="outline" className="text-xs">
                          Vote
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Feedback Types */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback Types</h3>
                <div className="space-y-3">
                  {feedbackTypes.map((type) => (
                    <div key={type.id} className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                      <div className={`p-2 rounded-lg ${type.color} text-white mr-3`}>
                        {type.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{type.title}</p>
                        <p className="text-xs text-gray-500">{type.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feedback Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Submit Your Feedback</CardTitle>
                  <CardDescription>
                    Share your ideas to help us make CareerPal even better.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                      </label>
                      <Input
                        id="title"
                        name="title"
                        type="text"
                        required
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Brief title for your suggestion"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                          Feedback Type *
                        </label>
                        <select
                          id="type"
                          name="type"
                          required
                          value={formData.type}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select type</option>
                          <option value="feature">Feature Request</option>
                          <option value="improvement">Improvement Suggestion</option>
                          <option value="general">General Feedback</option>
                          <option value="bug">Bug Report</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                          Priority
                        </label>
                        <select
                          id="priority"
                          name="priority"
                          value={formData.priority}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <Textarea
                        id="description"
                        name="description"
                        required
                        rows={6}
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe your suggestion in detail. Include the problem you're trying to solve, your proposed solution, and any benefits it would provide."
                        className="resize-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email (Optional)
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your.email@example.com"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        We&apos;ll use this to update you on the status of your request.
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <Star className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium mb-1">Tips for great feedback:</p>
                          <ul className="list-disc list-inside space-y-1 text-blue-700">
                            <li>Be specific about the problem or opportunity</li>
                            <li>Explain how your suggestion would help you and others</li>
                            <li>Include examples or use cases if possible</li>
                            <li>Check if similar requests already exist above</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <LoadingButton
                        type="submit"
                        loading={isSubmitting}
                        loadingText="Submitting..."
                        className="px-8"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Submit Feedback
                      </LoadingButton>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Community Guidelines */}
          <div className="mt-12">
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Community Guidelines
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">What to Include</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Clear problem description</li>
                      <li>• Specific use cases</li>
                      <li>• Expected benefits</li>
                      <li>• Constructive suggestions</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Please Avoid</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Vague or unclear requests</li>
                      <li>• Duplicate submissions</li>
                      <li>• Personal information</li>
                      <li>• Inappropriate content</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
} 