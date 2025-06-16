import Link from "next/link";
import { Button } from "../../components/ui/base/Button";

export default function Contact() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have questions about CvPrep? We&apos;re here to help! Reach out to our team and we&apos;ll get back to you as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Send us a message</h2>
            <form className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="billing">Billing & Subscriptions</option>
                  <option value="feature">Feature Request</option>
                  <option value="bug">Bug Report</option>
                  <option value="partnership">Partnership</option>
                  <option value="privacy">Privacy & Data</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tell us how we can help you..."
                ></textarea>
              </div>

              <Button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                Send Message
              </Button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Get in touch</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">General Support</h3>
                  <p className="text-gray-600 mb-2">For general questions and support</p>
                  <a href="mailto:support@cvprep.app" className="text-blue-600 hover:text-blue-800">
                    support@cvprep.app
                  </a>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Privacy & Data</h3>
                  <p className="text-gray-600 mb-2">For privacy-related inquiries</p>
                  <a href="mailto:privacy@cvprep.app" className="text-blue-600 hover:text-blue-800">
                    privacy@cvprep.app
                  </a>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Business Inquiries</h3>
                  <p className="text-gray-600 mb-2">For partnerships and business opportunities</p>
                  <a href="mailto:business@cvprep.app" className="text-blue-600 hover:text-blue-800">
                    business@cvprep.app
                  </a>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Legal</h3>
                  <p className="text-gray-600 mb-2">For legal and compliance matters</p>
                  <a href="mailto:legal@cvprep.app" className="text-blue-600 hover:text-blue-800">
                    legal@cvprep.app
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">How does the AI resume optimization work?</h3>
                  <p className="text-gray-600 text-sm">
                    Our AI analyzes your resume against job descriptions and provides specific recommendations 
                    to improve your match score and increase your chances of getting interviews.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Is my data secure?</h3>
                  <p className="text-gray-600 text-sm">
                    Yes, we use enterprise-grade security measures to protect your data. All information is 
                    encrypted and we never share your personal information with third parties.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Can I cancel my premium subscription?</h3>
                  <p className="text-gray-600 text-sm">
                    Yes, you can cancel your premium subscription at any time. You&apos;ll continue to have access 
                    to premium features until the end of your current billing period.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Do you offer refunds?</h3>
                  <p className="text-gray-600 text-sm">
                    We offer refunds within 7 days of purchase if you&apos;re not satisfied with our service. 
                    Please contact our support team for assistance.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Can&apos;t find what you&apos;re looking for? 
                  <a href="mailto:support@cvprep.app" className="text-blue-600 hover:text-blue-800 ml-1">
                    Contact our support team
                  </a>
                </p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Response Time</h3>
              <p className="text-gray-600 text-sm mb-4">
                We typically respond to all inquiries within 24 hours during business days. 
                For urgent matters, please mark your email as &quot;URGENT&quot; in the subject line.
              </p>
              <p className="text-xs text-gray-500">
                Business hours: Monday - Friday, 9:00 AM - 6:00 PM (PST)
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 