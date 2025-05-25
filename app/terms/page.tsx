import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing and using CareerPal (&quot;Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 mb-4">
              CareerPal is an AI-powered job search assistant that provides:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Resume optimization and scoring services</li>
              <li>Cover letter generation</li>
              <li>Interview preparation tools</li>
              <li>Career guidance and recommendations</li>
              <li>PDF generation and document management</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Our service uses artificial intelligence, including OpenAI&apos;s technology, to analyze and improve your career documents.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts and Registration</h2>
            <p className="text-gray-700 mb-4">
              To access certain features of our Service, you must register for an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your password and account</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Subscription Plans and Payment</h2>
            <h3 className="text-xl font-medium text-gray-900 mb-3">4.1 Free and Premium Plans</h3>
            <p className="text-gray-700 mb-4">
              CareerPal offers both free and premium subscription plans. Premium features include:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Advanced resume templates (Modern template)</li>
              <li>Enhanced AI optimization features</li>
              <li>Priority customer support</li>
              <li>Additional customization options</li>
            </ul>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">4.2 Payment Terms</h3>
            <p className="text-gray-700 mb-4">
              Premium subscriptions are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law.
            </p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">4.3 Cancellation</h3>
            <p className="text-gray-700 mb-4">
              You may cancel your premium subscription at any time. Upon cancellation, you will continue to have access to premium features until the end of your current billing period.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. User Content and Data</h2>
            <h3 className="text-xl font-medium text-gray-900 mb-3">5.1 Your Content</h3>
            <p className="text-gray-700 mb-4">
              You retain ownership of all content you upload to CareerPal, including resumes, cover letters, and personal information. 
              By using our Service, you grant us a limited license to process, analyze, and improve your content using AI technology.
            </p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">5.2 Content Guidelines</h3>
            <p className="text-gray-700 mb-4">You agree not to upload content that:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Contains false, misleading, or fraudulent information</li>
              <li>Violates any third-party rights</li>
              <li>Contains malicious code or harmful content</li>
              <li>Violates applicable laws or regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. AI Services and Limitations</h2>
            <p className="text-gray-700 mb-4">
              Our AI-powered features are provided &quot;as is&quot; and for informational purposes only. You acknowledge that:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>AI-generated content may not always be accurate or appropriate</li>
              <li>You should review and verify all AI-generated suggestions</li>
              <li>We do not guarantee job placement or interview success</li>
              <li>AI recommendations are based on general patterns and may not suit every situation</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Privacy and Data Protection</h2>
            <p className="text-gray-700 mb-4">
              Your privacy is important to us. Please review our <Link href="/privacy" className="text-blue-600 hover:text-blue-800 underline">Privacy Policy</Link>, 
              which explains how we collect, use, and protect your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Prohibited Uses</h2>
            <p className="text-gray-700 mb-4">You may not use our Service to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Transmit harmful, offensive, or inappropriate content</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Use automated tools to access the Service without permission</li>
              <li>Resell or redistribute our Service without authorization</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              The Service and its original content, features, and functionality are owned by CareerPal and are protected by 
              international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Disclaimers and Limitation of Liability</h2>
            <h3 className="text-xl font-medium text-gray-900 mb-3">10.1 Service Availability</h3>
            <p className="text-gray-700 mb-4">
              We strive to maintain high availability but do not guarantee uninterrupted access to our Service. 
              We may suspend or terminate the Service for maintenance, updates, or other operational reasons.
            </p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">10.2 Limitation of Liability</h3>
            <p className="text-gray-700 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, CAREERPAL SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, 
              USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You agree to defend, indemnify, and hold harmless CareerPal and its affiliates from and against any 
              claims, damages, obligations, losses, liabilities, costs, or debt arising from your use of the Service 
              or violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Termination</h2>
            <p className="text-gray-700 mb-4">
              We may terminate or suspend your account and access to the Service immediately, without prior notice, 
              for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of significant changes 
              via email or through the Service. Your continued use of the Service after such modifications constitutes 
              acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], 
              without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                Email: legal@careerpal.ai<br />
                Address: [Your Business Address]
              </p>
            </div>
          </section>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <Link 
              href="/" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Home
            </Link>
            <Link 
              href="/privacy" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Privacy Policy →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 