'use client';

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface LoadingStateProps {
  type: "scoring" | "optimizing";
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

  return (
    <div className="bg-white rounded-xl shadow-sm p-10 flex flex-col items-center justify-center text-center h-full">
      <div className="relative">
        {type === "optimizing" ? (
          <>
            <div className="absolute -inset-1 rounded-full bg-blue-100 animate-pulse"></div>
            <div className="relative bg-white rounded-full p-3 border border-blue-200">
              <Sparkles className="h-10 w-10 text-blue-600" />
            </div>
          </>
        ) : (
          <div className="h-10 w-10 bg-blue-500 rounded animate-pulse mb-4" />
        )}
      </div>
      
      <h3 className="text-lg font-medium text-gray-800 mb-2 mt-4">{title}</h3>
      <p className="text-gray-600 max-w-md mb-3">{description}</p>
      
      {type === "optimizing" && (
        <p className="text-blue-600 text-sm mb-6 font-medium">
          Your score results are available on the left while we prepare your optimized resume
        </p>
      )}
      
      {type === "optimizing" && (
        <div className="w-full max-w-md bg-blue-50 rounded-lg p-4 border border-blue-100">
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
                    <span>{index + 1}</span>
                  )}
                </div>
                <p className="text-sm text-gray-700">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 