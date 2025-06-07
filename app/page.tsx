"use client";
import { ArrowRight, CheckCircle, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/Button";
import LandingHeader from "../components/ui/LandingHeader";

export default function Home() {
  const router = useRouter();

  // Handler for primary CTA button - go to login instead of requiring auth
  const handlePrimaryAction = () => {
    router.push('/login');
  };

  // Navigate to specific feature page
  const goToFeature = (path: string) => {
    router.push(path);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Use the header component */}
      <LandingHeader />

      {/* Hero Section - Two Column Layout */}
      <section className="relative bg-gradient-to-b from-white via-blue-50 to-white pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Two Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center min-h-[600px]">
            
            {/* Left Column - Content */}
            <div className="lg:col-span-2 flex flex-col justify-center space-y-8">
              {/* Main Headline */}
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black leading-tight">
                  ✨ AI-Powered CV Optimization & ATS Scoring
                </h1>
              </div>
              
              {/* Social Proof Subheadline */}
              <div className="space-y-4">
                <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
                  Loved by early users and career coaches. Match your CV to jobs with 90%+ accuracy in under 60 seconds.
                </p>
                
                {/* Trust Indicators */}
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="ml-2 font-medium">4.9/5 from 2,000+ users</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>60-second setup</span>
                  </div>
                </div>
              </div>
              
              {/* CTA Button */}
              <div className="space-y-4">
                <Button 
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-lg px-10 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  onClick={handlePrimaryAction}
                >
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                <p className="text-sm text-gray-500">
                  Join thousands of job seekers landing their dream jobs faster
                </p>
              </div>
            </div>
            
            {/* Right Column - Live Demo/Animation */}
            <div className="lg:col-span-3 flex justify-center lg:justify-end">
              <div className="relative max-w-2xl w-full">
                {/* Demo Preview with hover animation */}
                <div className="relative rounded-2xl shadow-2xl overflow-hidden border border-gray-200 bg-white cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-3xl" onClick={handlePrimaryAction}>
                  {/* Demo Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                      ✨ Live Demo
                    </div>
                  </div>
                  
                  {/* Demo Image */}
                  <Image 
                    src="/dash.png"
                    alt="CvPrep Live Demo - Resume Scoring"
                    width={800}
                    height={500}
                    className="w-full h-auto"
                    priority
                  />
                </div>
                
                {/* Floating elements for visual appeal */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-bounce delay-100"></div>
                <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Features Section - Redesigned with Modern Layout */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 mb-4">
              ✨ Powerful AI Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to Land Your Dream Job
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                                  Our AI-powered platform provides all the tools you need to stand out in today&apos;s competitive job market
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="space-y-24">
            
            {/* Feature 1 - CV Optimization */}
            <div className="relative">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Content */}
                <div className="lg:order-1">
                  <div className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 mb-6">
                    🎯 CV Optimization
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                    Transform Your CV with AI Precision
                  </h3>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Our advanced AI analyzes job descriptions and optimizes your CV to match exactly what employers are looking for. 
                    Get past ATS systems and land more interviews.
                  </p>
                  
                  {/* Features Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">ATS Optimization</h4>
                        <p className="text-sm text-gray-600">Beat applicant tracking systems</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Keyword Matching</h4>
                        <p className="text-sm text-gray-600">Match job requirements precisely</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Skills Enhancement</h4>
                        <p className="text-sm text-gray-600">Highlight relevant abilities</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Professional Format</h4>
                        <p className="text-sm text-gray-600">Clean, modern templates</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={() => goToFeature('/dashboard')}
                  >
                    Optimize Your CV <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
                
                {/* Image */}
                <div className="lg:order-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl transform rotate-3"></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 transform transition-transform duration-300 hover:scale-105 cursor-pointer" onClick={() => goToFeature('/dashboard')}>
                      <Image
                        src="/ed.png"
                        alt="CV Optimization Dashboard"
                        width={600}
                        height={400}
                        className="w-full h-auto"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Client Testimonial */}
              <div className="mt-12 max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                  <div className="flex items-center mb-6">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-900">5.0 out of 5</span>
                  </div>
                                     <blockquote className="text-xl text-gray-700 font-medium mb-6 leading-relaxed">
                     &ldquo;CvPrep&apos;s AI optimization increased my interview callback rate by 300%. The keyword matching is incredible - 
                     my CV now perfectly aligns with job requirements. I landed my dream role at Google within 6 weeks!&rdquo;
                   </blockquote>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        S
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-lg font-semibold text-gray-900">Sarah Chen</p>
                      <p className="text-gray-600">Senior Software Engineer at Google</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 - ATS Scoring */}
            <div className="relative">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Image */}
                <div className="lg:order-1">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl transform -rotate-3"></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 transform transition-transform duration-300 hover:scale-105 cursor-pointer" onClick={() => goToFeature('/dashboard')}>
                      <Image
                        src="/score.png"
                        alt="ATS Scoring System"
                        width={600}
                        height={400}
                        className="w-full h-auto"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="lg:order-2">
                  <div className="inline-flex items-center rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800 mb-6">
                    📊 Smart Scoring
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                    Get Instant Match Scores & Insights
                  </h3>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Know exactly how well your CV matches any job before applying. Our AI gives you detailed scoring 
                    and actionable recommendations to improve your chances.
                  </p>
                  
                  {/* Score Metrics */}
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="text-3xl font-bold text-green-600 mb-1">95%</div>
                      <div className="text-sm text-green-700 font-medium">Average Match Score</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="text-3xl font-bold text-blue-600 mb-1">60s</div>
                      <div className="text-sm text-blue-700 font-medium">Instant Results</div>
                    </div>
                  </div>
                  
                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">Real-time compatibility analysis</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">Skill gap identification</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">Detailed improvement suggestions</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={() => goToFeature('/dashboard')}
                  >
                    Try CV Scoring <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              {/* Client Testimonial */}
              <div className="mt-12 max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                  <div className="flex items-center mb-6">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-900">5.0 out of 5</span>
                  </div>
                                     <blockquote className="text-xl text-gray-700 font-medium mb-6 leading-relaxed">
                     &ldquo;The scoring system is a game-changer! I can see exactly what skills I&apos;m missing for each role 
                     and optimize accordingly. It&apos;s like having a career coach available 24/7.&rdquo;
                   </blockquote>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        M
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-lg font-semibold text-gray-900">Marcus Johnson</p>
                      <p className="text-gray-600">Product Manager at Microsoft</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            

            {/* Feature 4 - Cover Letter Generator */}
            <div className="relative">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Image */}
                <div className="lg:order-1">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl transform -rotate-3"></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 transform transition-transform duration-300 hover:scale-105 cursor-pointer" onClick={() => goToFeature('/cover-letter')}>
                      <Image
                        src="/cover.png"
                        alt="Cover Letter Generator"
                        width={600}
                        height={400}
                        className="w-full h-auto"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="lg:order-2">
                  <div className="inline-flex items-center rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-800 mb-6">
                    ✍️ Cover Letter Generator
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                    Create Compelling Cover Letters in Minutes
                  </h3>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Generate personalized, persuasive cover letters tailored to each job application. 
                    Our AI crafts compelling narratives that highlight your unique value proposition.
                  </p>
                  
                  {/* Features List */}
                  <div className="space-y-4 mb-8">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900">Job-Specific Customization</h4>
                        <p className="text-sm text-gray-600">Tailored content for each role and company</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900">Professional Tone</h4>
                        <p className="text-sm text-gray-600">Perfectly balanced formal yet engaging language</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900">Multiple Formats</h4>
                        <p className="text-sm text-gray-600">Various templates for different industries</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900">Instant Generation</h4>
                        <p className="text-sm text-gray-600">Create professional letters in under 2 minutes</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={() => goToFeature('/cover-letter')}
                  >
                    Generate Cover Letter <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              {/* Client Testimonial */}
              <div className="mt-12 max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                  <div className="flex items-center mb-6">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-900">5.0 out of 5</span>
                  </div>
                  <blockquote className="text-xl text-gray-700 font-medium mb-6 leading-relaxed">
                    &ldquo;The cover letter generator saved me hours of writing time. Each letter feels personal and professional, 
                    and I&apos;ve noticed a significant increase in response rates from employers.&rdquo;
                  </blockquote>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        D
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-lg font-semibold text-gray-900">David Park</p>
                      <p className="text-gray-600">Marketing Director at Tesla</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 5 - Interview Prep */}
            <div className="relative">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Content */}
                <div className="lg:order-1">
                  <div className="inline-flex items-center rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-800 mb-6">
                    🎤 Interview Preparation
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                    Master Your Interview Skills with AI
                  </h3>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Practice with our AI interview simulator that provides real-time feedback and personalized coaching. 
                    Build confidence and nail your next interview.
                  </p>
                  
                  {/* Interview Stats */}
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="text-center p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                      <div className="text-3xl font-bold text-indigo-600 mb-1">500+</div>
                      <div className="text-sm text-indigo-700 font-medium">Practice Questions</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="text-3xl font-bold text-green-600 mb-1">85%</div>
                      <div className="text-sm text-green-700 font-medium">Success Rate</div>
                    </div>
                  </div>
                  
                  {/* Features List */}
                  <div className="space-y-4 mb-8">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900">AI-Powered Simulation</h4>
                        <p className="text-sm text-gray-600">Realistic interview scenarios with instant feedback</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900">Industry-Specific Questions</h4>
                        <p className="text-sm text-gray-600">Targeted practice for your field and role level</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900">Performance Analytics</h4>
                        <p className="text-sm text-gray-600">Track your progress and improvement areas</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900">Confidence Building</h4>
                        <p className="text-sm text-gray-600">Reduce anxiety with unlimited practice sessions</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={() => goToFeature('/interview-prep')}
                  >
                    Start Interview Practice <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
                
                {/* Image */}
                <div className="lg:order-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl transform rotate-3"></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 transform transition-transform duration-300 hover:scale-105 cursor-pointer" onClick={() => goToFeature('/interview-prep')}>
                      <Image
                        src="/int.png"
                        alt="Interview Preparation Platform"
                        width={600}
                        height={400}
                        className="w-full h-auto"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Client Testimonial */}
              <div className="mt-12 max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                  <div className="flex items-center mb-6">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-900">5.0 out of 5</span>
                  </div>
                  <blockquote className="text-xl text-gray-700 font-medium mb-6 leading-relaxed">
                    &ldquo;The interview practice transformed my confidence completely. The AI feedback helped me identify 
                    weak points I never noticed. I aced my final interview and got the job!&rdquo;
                  </blockquote>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        A
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-lg font-semibold text-gray-900">Alex Thompson</p>
                      <p className="text-gray-600">Data Scientist at Netflix</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center text-lg font-medium text-gray-600 mb-8">
            Trusted by fast-growing job seekers
          </h2>
        </div>
      </section>

      {/* Free Your Time Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Free your time to <span className="text-blue-600">build</span> your career
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            Your time as a job seeker is extremely valuable, don&apos;t waste it on formatting resumes or writing cover letters.
            Set job search on autopilot and replace manual work with AI assistance.
          </p>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
            onClick={() => router.push('/login')}
          >
            Start free trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4" style={{ backgroundColor: '#252525' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">CvPrep</h3>
            <p className="text-gray-300 text-sm">The AI-powered job search assistant for modern professionals.</p>
          </div>
          <div>
            <h4 className="font-medium mb-4 text-white">Features</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/resume-builder" className="text-gray-300 hover:text-white transition-colors">Resume Builder</Link></li>
              <li><Link href="/interview-prep" className="text-gray-300 hover:text-white transition-colors">Interview Prep</Link></li>
              <li><Link href="/cover-letter" className="text-gray-300 hover:text-white transition-colors">Cover Letter Generator</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4 text-white">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-gray-300 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4 text-white">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-300 hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-gray-600 text-center text-sm text-gray-300">
          &copy; {new Date().getFullYear()} CvPrep. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
