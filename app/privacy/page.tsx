import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              CareerPal (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our AI-powered job search assistant service.
            </p>
            <p className="text-gray-700 mb-4">
              By using CareerPal, you consent to the data practices described in this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">2.1 Personal Information</h3>
            <p className="text-gray-700 mb-4">We collect personal information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Account Information:</strong> Name, email address, profile picture (via Google OAuth)</li>
              <li><strong>Resume Content:</strong> Work experience, education, skills, contact details</li>
              <li><strong>Career Documents:</strong> Resumes, cover letters, and related files you upload</li>
              <li><strong>Job Preferences:</strong> Job descriptions, career goals, and search criteria</li>
              <li><strong>Communication Data:</strong> Messages, feedback, and support requests</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">2.2 Automatically Collected Information</h3>
            <p className="text-gray-700 mb-4">We automatically collect certain information when you use our service:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the service</li>
              <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
              <li><strong>Log Data:</strong> Server logs, error reports, and performance metrics</li>
              <li><strong>Cookies:</strong> Authentication tokens, preferences, and session data</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">2.3 Third-Party Information</h3>
            <p className="text-gray-700 mb-4">We may receive information from third-party services:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Google OAuth:</strong> Basic profile information when you sign in with Google</li>
              <li><strong>Payment Processors:</strong> Transaction data for premium subscriptions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use your information for the following purposes:</p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">3.1 Service Provision</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Analyze and optimize your resume content using AI technology</li>
              <li>Generate personalized cover letters and career recommendations</li>
              <li>Provide resume scoring and job matching services</li>
              <li>Create and manage your account and user profile</li>
              <li>Process premium subscription payments</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">3.2 AI Processing</h3>
            <p className="text-gray-700 mb-4">
              We use artificial intelligence, including OpenAI&rsquo;s technology, to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Analyze resume content and job descriptions</li>
              <li>Generate optimization suggestions and recommendations</li>
              <li>Score resume-job compatibility</li>
              <li>Create personalized career guidance</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">3.3 Service Improvement</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Monitor and analyze usage patterns to improve our service</li>
              <li>Develop new features and functionality</li>
              <li>Ensure service security and prevent fraud</li>
              <li>Provide customer support and respond to inquiries</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">3.4 Communication</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Send service-related notifications and updates</li>
              <li>Provide customer support and technical assistance</li>
              <li>Send marketing communications (with your consent)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">4.1 Third-Party Service Providers</h3>
            <p className="text-gray-700 mb-4">We share information with trusted third-party providers who assist us in operating our service:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>OpenAI:</strong> For AI-powered resume analysis and optimization</li>
              <li><strong>Supabase:</strong> For database hosting and authentication services</li>
              <li><strong>Google:</strong> For authentication and user account management</li>
              <li><strong>Payment Processors:</strong> For processing premium subscription payments</li>
              <li><strong>Cloud Hosting:</strong> For service infrastructure and data storage</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">4.2 Legal Requirements</h3>
            <p className="text-gray-700 mb-4">We may disclose your information when required by law or to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Comply with legal obligations or court orders</li>
              <li>Protect our rights, property, or safety</li>
              <li>Investigate potential violations of our Terms of Service</li>
              <li>Prevent fraud or security threats</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">4.3 Business Transfers</h3>
            <p className="text-gray-700 mb-4">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred 
              as part of the business transaction, subject to equivalent privacy protections.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-700 mb-4">We implement appropriate security measures to protect your information:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Encryption:</strong> Data is encrypted in transit and at rest</li>
              <li><strong>Access Controls:</strong> Limited access to personal data on a need-to-know basis</li>
              <li><strong>Authentication:</strong> Secure OAuth-based authentication system</li>
              <li><strong>Monitoring:</strong> Regular security audits and monitoring for threats</li>
              <li><strong>Data Minimization:</strong> We collect only necessary information</li>
            </ul>
            <p className="text-gray-700 mb-4">
              However, no method of transmission over the internet or electronic storage is 100% secure. 
              While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
            <p className="text-gray-700 mb-4">We retain your information for as long as necessary to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Provide our services to you</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes and enforce agreements</li>
              <li>Improve our services and develop new features</li>
            </ul>
            <p className="text-gray-700 mb-4">
              When you delete your account, we will delete or anonymize your personal information within 30 days, 
              except where retention is required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights and Choices</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">7.1 Access and Control</h3>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Update:</strong> Correct or update your account information</li>
              <li><strong>Delete:</strong> Request deletion of your personal information</li>
              <li><strong>Export:</strong> Download your data in a portable format</li>
              <li><strong>Restrict:</strong> Limit how we process your information</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">7.2 Communication Preferences</h3>
            <p className="text-gray-700 mb-4">You can:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Opt out of marketing communications at any time</li>
              <li>Manage notification preferences in your account settings</li>
              <li>Contact us to update your communication preferences</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">7.3 Cookies and Tracking</h3>
            <p className="text-gray-700 mb-4">
              You can control cookies through your browser settings. However, disabling cookies may affect 
              the functionality of our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. International Data Transfers</h2>
            <p className="text-gray-700 mb-4">
              Your information may be transferred to and processed in countries other than your own. 
              We ensure appropriate safeguards are in place to protect your information in accordance 
              with applicable data protection laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children&rsquo;s Privacy</h2>
            <p className="text-gray-700 mb-4">
              Our service is not intended for children under 13 years of age. We do not knowingly collect 
              personal information from children under 13. If we become aware that we have collected 
              personal information from a child under 13, we will take steps to delete such information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. California Privacy Rights</h2>
            <p className="text-gray-700 mb-4">
              If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Right to know what personal information is collected and how it&apos;s used</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of the sale of personal information (we do not sell personal information)</li>
              <li>Right to non-discrimination for exercising your privacy rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. European Privacy Rights (GDPR)</h2>
            <p className="text-gray-700 mb-4">
              If you are in the European Economic Area, you have rights under the General Data Protection Regulation (GDPR):
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Right of access to your personal data</li>
              <li>Right to rectification of inaccurate data</li>
              <li>Right to erasure (&quot;right to be forgotten&quot;)</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
              <li>Right to withdraw consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes 
              by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. 
              We encourage you to review this Privacy Policy periodically.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> privacy@careerpal.ai<br />
                <strong>Data Protection Officer:</strong> dpo@careerpal.ai<br />
                <strong>Address:</strong> [Your Business Address]<br />
                <strong>Phone:</strong> [Your Contact Number]
              </p>
            </div>
            <p className="text-gray-700 mt-4">
              For GDPR-related inquiries, please contact our Data Protection Officer at dpo@careerpal.ai.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <Link 
              href="/terms" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Terms of Service
            </Link>
            <Link 
              href="/" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Back to Home →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 