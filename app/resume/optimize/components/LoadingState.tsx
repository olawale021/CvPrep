'use client';

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface LoadingStateProps {
  type: "scoring" | "optimizing" | "dashboard";
}

export default function LoadingState({ type }: LoadingStateProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const title = type === "scoring" 
    ? "Scoring your resume..." 
    : "Creating your optimized resume...";
    
  const description = type === "scoring" 
    ? "We're analyzing how well your resume matches this job description."
    : "We're tailoring your resume to better match this job description, enhancing sections and highlighting your relevant skills.";

  const steps = type === "optimizing" ? [
    "Analyzing job requirements",
    "Matching your skills & experience",
    "Reorganizing resume sections",
    "Creating optimized content"
  ] : [];

  // Cycle through steps for optimizing type
  useEffect(() => {
    if (type === "optimizing" && steps.length > 0) {
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % steps.length);
      }, 2000); // Change step every 2 seconds
      
      return () => clearInterval(interval);
    }
  }, [type, steps.length]);

  // For scoring, show simple loading state
  if (type === "scoring") {
    return (
      <div className="bg-white rounded-xl shadow-sm p-10 flex flex-col items-center justify-center text-center h-full">
        <div className="h-10 w-10 bg-blue-500 rounded animate-pulse mb-4" />
        <h3 className="text-lg font-medium text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 max-w-md">{description}</p>
      </div>
    );
  }

  // For dashboard, show left-right layout matching the dashboard design
  if (type === "dashboard") {
    return (
      <div className="flex flex-col lg:flex-row lg:gap-6 min-h-[calc(100vh-200px)]">
        {/* Left Column - Resume Analysis Skeleton */}
        <div className="w-full lg:w-[60%] mb-4 sm:mb-6 lg:mb-0">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden h-full">
            {/* Header with Progress */}
            <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-blue-100 animate-pulse"></div>
                  <div className="relative bg-white rounded-full p-3 border border-blue-200">
                    <Sparkles className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-800 text-center mb-2">Creating your optimized resume...</h3>
              <p className="text-gray-600 text-center max-w-md mx-auto mb-4">
                We&rsquo;re tailoring your resume to better match this job description, enhancing sections and highlighting your relevant skills.
              </p>
              
              <p className="text-blue-600 text-sm text-center font-medium mb-4">
                Your score results are available on the right while we prepare your optimized resume
              </p>
              
              {/* Progress Steps */}
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div key={index} className="flex items-center">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${
                        index <= currentStep 
                          ? "bg-blue-500 text-white" 
                          : "bg-gray-200 text-gray-400"
                      }`}>
                        {index < currentStep ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className="text-xs">{index + 1}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Resume Content Skeleton */}
            <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(100vh-400px)]">
              <div className="space-y-6">
                {/* Contact Information Skeleton */}
                <div className="text-center border-b border-gray-100 pb-6">
                  <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
                  <div className="h-4 w-56 bg-gray-200 rounded animate-pulse mx-auto"></div>
                </div>

                {/* Professional Summary Skeleton */}
                <div className="space-y-3">
                  <div className="h-6 w-40 bg-gray-300 rounded animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>

                {/* Skills Skeleton */}
                <div className="space-y-3">
                  <div className="h-6 w-32 bg-gray-300 rounded animate-pulse"></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>

                {/* Work Experience Skeleton */}
                <div className="space-y-4">
                  <div className="h-6 w-48 bg-gray-300 rounded animate-pulse"></div>
                  
                  {/* Experience 1 */}
                  <div className="space-y-2 pl-4 border-l-2 border-gray-100">
                    <div className="flex justify-between items-start">
                      <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-4 w-56 bg-gray-200 rounded animate-pulse"></div>
                    <div className="space-y-1 mt-2">
                      <div className="h-3 w-full bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-full bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-4/5 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>

                  {/* Experience 2 */}
                  <div className="space-y-2 pl-4 border-l-2 border-gray-100">
                    <div className="flex justify-between items-start">
                      <div className="h-5 w-52 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                    <div className="space-y-1 mt-2">
                      <div className="h-3 w-full bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-5/6 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Education Skeleton */}
                <div className="space-y-3">
                  <div className="h-6 w-36 bg-gray-300 rounded animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="h-5 w-56 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>

                {/* Projects Skeleton */}
                <div className="space-y-3">
                  <div className="h-6 w-28 bg-gray-300 rounded animate-pulse"></div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="h-5 w-44 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Certifications Skeleton */}
                <div className="space-y-3">
                  <div className="h-6 w-40 bg-gray-300 rounded animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-56 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Score Result Skeleton */}
        <div className="w-full lg:w-[40%]">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-6 w-48 bg-gray-300 rounded animate-pulse"></div>
              </div>
            </div>

            <div className="p-6">
              {/* Score Circle Skeleton */}
              <div className="text-center mb-6">
                <div className="w-32 h-32 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
              </div>

              {/* Skills Analysis Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Matched Skills */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 bg-green-300 rounded animate-pulse"></div>
                    <div className="h-5 w-24 bg-gray-300 rounded animate-pulse"></div>
                    <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></div>
                        <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 bg-red-300 rounded animate-pulse"></div>
                    <div className="h-5 w-24 bg-gray-300 rounded animate-pulse"></div>
                    <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-red-300 rounded-full animate-pulse"></div>
                        <div className="h-3 w-28 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Skills Summary Skeleton */}
              <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="h-6 w-8 bg-green-200 rounded animate-pulse mb-1"></div>
                      <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="w-px h-8 bg-gray-300"></div>
                    <div className="text-center">
                      <div className="h-6 w-8 bg-red-200 rounded animate-pulse mb-1"></div>
                      <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="w-px h-8 bg-gray-300"></div>
                    <div className="text-center">
                      <div className="h-6 w-10 bg-blue-200 rounded animate-pulse mb-1"></div>
                      <div className="h-3 w-14 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="w-20 bg-gray-200 rounded-full h-2 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Recommendations Skeleton */}
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <div className="h-4 w-4 bg-yellow-300 rounded animate-pulse mr-2"></div>
                  <div className="h-5 w-32 bg-gray-300 rounded animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-yellow-300 rounded-full mt-2 animate-pulse"></div>
                      <div className="h-3 w-full bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons Skeleton */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For optimizing, show detailed skeleton loader
  return (
    <div className="h-full flex flex-col">
      {/* Progress Header */}
      <div className="bg-blue-50 border-b border-blue-100 p-6 rounded-t-xl">
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-blue-100 animate-pulse"></div>
            <div className="relative bg-white rounded-full p-3 border border-blue-200">
              <Sparkles className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-800 text-center mb-2">{title}</h3>
        <p className="text-gray-600 text-center max-w-md mx-auto mb-4">{description}</p>
        
        <p className="text-blue-600 text-sm text-center font-medium mb-4">
          Your score results are available on the left while we prepare your optimized resume
        </p>
        
        {/* Progress Steps */}
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${
                  index <= currentStep 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-200 text-gray-400"
                }`}>
                  {index < currentStep ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-xs">{index + 1}</span>
                  )}
                </div>
                <p className="text-sm text-gray-700">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resume Skeleton Preview */}
      <div className="flex-1 p-6 bg-white rounded-b-xl overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Contact Information Skeleton */}
          <div className="text-center border-b border-gray-100 pb-6">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
            <div className="h-4 w-56 bg-gray-200 rounded animate-pulse mx-auto"></div>
          </div>

          {/* Professional Summary Skeleton */}
          <div className="space-y-3">
            <div className="h-6 w-40 bg-gray-300 rounded animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Skills Skeleton */}
          <div className="space-y-3">
            <div className="h-6 w-32 bg-gray-300 rounded animate-pulse"></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Work Experience Skeleton */}
          <div className="space-y-4">
            <div className="h-6 w-48 bg-gray-300 rounded animate-pulse"></div>
            
            {/* Experience 1 */}
            <div className="space-y-2 pl-4 border-l-2 border-gray-100">
              <div className="flex justify-between items-start">
                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-4 w-56 bg-gray-200 rounded animate-pulse"></div>
              <div className="space-y-1 mt-2">
                <div className="h-3 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-4/5 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Experience 2 */}
            <div className="space-y-2 pl-4 border-l-2 border-gray-100">
              <div className="flex justify-between items-start">
                <div className="h-5 w-52 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="space-y-1 mt-2">
                <div className="h-3 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-5/6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Education Skeleton */}
          <div className="space-y-3">
            <div className="h-6 w-36 bg-gray-300 rounded animate-pulse"></div>
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div className="h-5 w-56 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Projects Skeleton */}
          <div className="space-y-3">
            <div className="h-6 w-28 bg-gray-300 rounded animate-pulse"></div>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="h-5 w-44 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Certifications Skeleton */}
          <div className="space-y-3">
            <div className="h-6 w-40 bg-gray-300 rounded animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-56 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 