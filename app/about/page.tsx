import Link from "next/link";
import { Button } from "../../components/ui/base/Button";

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About CvPrep
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            We&apos;re on a mission to democratize career success by making AI-powered job search tools 
            accessible to everyone, regardless of their background or experience level.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                Job searching shouldn&apos;t be a full-time job. We believe that everyone deserves access to 
                the same high-quality career tools that were once only available to those who could 
                afford expensive career coaches.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                CvPrep leverages cutting-edge AI technology to provide personalized career guidance, 
                resume optimization, and interview preparation - all at a fraction of the cost of 
                traditional career services.
              </p>
              <p className="text-lg text-gray-600">
                Our goal is simple: help you land your dream job faster and with more confidence.
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Our Impact</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="text-3xl font-bold text-blue-600 mr-4">10K+</div>
                  <div className="text-gray-600">Resumes optimized</div>
                </div>
                <div className="flex items-center">
                  <div className="text-3xl font-bold text-blue-600 mr-4">85%</div>
                  <div className="text-gray-600">Average score improvement</div>
                </div>
                <div className="flex items-center">
                  <div className="text-3xl font-bold text-blue-600 mr-4">5K+</div>
                  <div className="text-gray-600">Cover letters generated</div>
                </div>
                <div className="flex items-center">
                  <div className="text-3xl font-bold text-blue-600 mr-4">92%</div>
                  <div className="text-gray-600">User satisfaction rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Innovation</h3>
              <p className="text-gray-600">
                We continuously push the boundaries of what&apos;s possible with AI to create better, 
                more effective career tools.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Privacy First</h3>
              <p className="text-gray-600">
                Your career data is sensitive. We implement enterprise-grade security and never 
                share your information without your explicit consent.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Accessibility</h3>
              <p className="text-gray-600">
                Career success shouldn&apos;t depend on your budget. We offer powerful free tools and 
                affordable premium features for everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Story</h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-600 mb-6">
              CvPrep was born from a simple observation: job searching is broken. Despite living in 
              the age of AI, most job seekers still rely on outdated methods - generic resume templates, 
              one-size-fits-all cover letters, and expensive career coaches.
            </p>
            <p className="text-lg text-gray-600 mb-6">
              Our founders experienced this frustration firsthand. After spending countless hours 
              crafting resumes and cover letters, only to receive automated rejection emails, they 
              realized there had to be a better way.
            </p>
            <p className="text-lg text-gray-600 mb-6">
              That&apos;s when they decided to build CvPrep - an AI-powered platform that could provide 
              personalized career guidance at scale. By leveraging the latest advances in artificial 
              intelligence, we can analyze job descriptions, optimize resumes, and provide tailored 
              recommendations in seconds, not hours.
            </p>
            <p className="text-lg text-gray-600">
              Today, CvPrep helps thousands of job seekers every month land interviews and advance 
              their careers. We&apos;re just getting started.
            </p>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Powered by Advanced AI</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Cutting-Edge Technology</h3>
              <p className="text-lg text-gray-600 mb-6">
                CvPrep is built on state-of-the-art AI technology, including large language models 
                and machine learning algorithms that understand the nuances of modern hiring practices.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Natural Language Processing for resume analysis
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Machine Learning for job matching algorithms
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Advanced AI for personalized content generation
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Real-time optimization and feedback
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Our Tech Stack</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">AI & Machine Learning</span>
                  </div>
                  <div className="text-sm text-gray-600">OpenAI GPT, Custom ML Models</div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Frontend</span>
                  </div>
                  <div className="text-sm text-gray-600">Next.js, React, TypeScript</div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Backend</span>
                  </div>
                  <div className="text-sm text-gray-600">Node.js, Supabase, PostgreSQL</div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Infrastructure</span>
                  </div>
                  <div className="text-sm text-gray-600">Vercel, AWS, Enterprise Security</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to accelerate your career?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have already transformed their job search with CvPrep&apos;s AI-powered tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-white text-slate-800 hover:bg-gray-100 px-8 py-3">
              <Link href="/login">Get Started Free</Link>
            </Button>
            <Button className="bg-slate-800 text-white hover:bg-slate-700 px-8 py-3">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Back to Home */}
      <div className="py-8 text-center bg-gray-50">
        <Link 
          href="/" 
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
} 