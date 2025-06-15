"use client";

import {
    ArrowLeft,
    CheckCircle,
    Clock,
    HelpCircle,
    Mail,
    MessageSquare,
    Phone,
    Send
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

const supportOptions = [
  {
    title: "Email Support",
    description: "Get detailed help via email. We typically respond within 24 hours.",
    icon: <Mail className="h-6 w-6" />,
    color: "bg-blue-500",
    action: "Send Email",
    href: "mailto:support@careerpal.com",
    responseTime: "24 hours"
  },
  {
    title: "Live Chat",
    description: "Chat with our support team in real-time during business hours.",
    icon: <MessageSquare className="h-6 w-6" />,
    color: "bg-green-500",
    action: "Start Chat",
    href: "#chat",
    responseTime: "Immediate",
    available: true
  },
  {
    title: "Phone Support",
    description: "Speak directly with our support team for urgent issues.",
    icon: <Phone className="h-6 w-6" />,
    color: "bg-purple-500",
    action: "Call Now",
    href: "tel:+1-555-CAREER",
    responseTime: "Immediate",
    businessHours: true
  }
];

const commonIssues = [
  {
    title: "Can't upload my resume",
    description: "File format or size issues",
    category: "Technical",
    severity: "medium"
  },
  {
    title: "Login problems",
    description: "Password reset or account access",
    category: "Account",
    severity: "high"
  },
  {
    title: "Resume score seems incorrect",
    description: "Questions about scoring algorithm",
    category: "Feature",
    severity: "low"
  },
  {
    title: "Payment or billing issue",
    description: "Subscription or payment problems",
    category: "Billing",
    severity: "high"
  }
];

export default function ContactSupport() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    priority: "medium",
    message: ""
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
                  Support Request Submitted
                </h1>
                <p className="text-gray-600 mb-6">
                  Thank you for contacting us! We&apos;ve received your support request and will get back to you within 24 hours.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600">
                    <strong>Ticket ID:</strong> <TicketId prefix="CS" />
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Subject:</strong> {formData.subject}
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Support</h1>
            <p className="text-lg text-gray-600">
              Get help from our support team. Choose the best way to reach us.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Support Options */}
            <div className="lg:col-span-1">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Support Options</h2>
              <div className="space-y-4">
                {supportOptions.map((option, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start">
                        <div className={`p-2 rounded-lg ${option.color} text-white mr-3 flex-shrink-0`}>
                          {option.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{option.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                          <div className="flex items-center text-xs text-gray-500 mb-3">
                            <Clock className="h-3 w-3 mr-1" />
                            Response time: {option.responseTime}
                            {option.businessHours && " (Business hours)"}
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full"
                            disabled={option.businessHours && !option.available}
                          >
                            {option.action}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Common Issues */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Issues</h3>
                <div className="space-y-2">
                  {commonIssues.map((issue, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{issue.title}</p>
                          <p className="text-xs text-gray-500">{issue.description}</p>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                            issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {issue.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Support Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Submit a Support Request</CardTitle>
                  <CardDescription>
                    Fill out the form below and we&apos;ll get back to you as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="your.email@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                      </label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        required
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="Brief description of your issue"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                          Category *
                        </label>
                        <select
                          id="category"
                          name="category"
                          required
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select a category</option>
                          <option value="technical">Technical Issue</option>
                          <option value="account">Account & Login</option>
                          <option value="billing">Billing & Payments</option>
                          <option value="feature">Feature Request</option>
                          <option value="bug">Bug Report</option>
                          <option value="other">Other</option>
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
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Message *
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        rows={6}
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce the problem, and what you expected to happen."
                        className="resize-none"
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <HelpCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium mb-1">Tips for faster resolution:</p>
                          <ul className="list-disc list-inside space-y-1 text-blue-700">
                            <li>Include specific error messages if any</li>
                            <li>Mention your browser and operating system</li>
                            <li>Describe the steps that led to the issue</li>
                            <li>Attach screenshots if helpful</li>
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
                        Submit Request
                      </LoadingButton>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 