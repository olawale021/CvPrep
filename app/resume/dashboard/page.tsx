"use client";

import { FileText, Loader2, Sparkles } from "lucide-react";
import React, { FormEvent, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { ErrorBoundary } from "../../../components/ui/ErrorBoundary";
import Sidebar from "../../../components/ui/Sidebar";
import { useAuth } from "../../../context/AuthContext";
import { useAsyncOperation } from "../../../hooks/useAsyncOperation";
import { ResumeScore } from "../../../lib/resume/scoreResume";
import ErrorMessage from "../optimize/components/ErrorMessage";
import LoadingState from "../optimize/components/LoadingState";
import OptimizedResume from "../optimize/components/OptimizedResume";
import ResumeUploadForm from "../optimize/components/ResumeUploadForm";
import { ResumeEditProvider } from "../optimize/context/ResumeEditContext";
import { usePdfGenerator } from "../optimize/hooks/usePdfGenerator";
import { ResumeData, ResumeResponse } from "../optimize/types";
import DashboardScoreResult from "./components/DashboardScoreResult";

export default function ResumeDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>("");
  const [originalResumeData, setOriginalResumeData] = useState<ResumeData | null>(null);
  const [optimizedResume, setOptimizedResume] = useState<ResumeData | null>(null);
  const [resumeResponse, setResumeResponse] = useState<ResumeResponse | null>(null);
  const [scoreResult, setScoreResult] = useState<ResumeScore | null>(null);
  const [showOptimized, setShowOptimized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { isPdfGenerating, downloadPdf } = usePdfGenerator();

  // All async operations
  const analyzeOperation = useAsyncOperation(
    async (...args: unknown[]) => {
      const [file, jobDescription] = args as [File, string];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('job', jobDescription);

      const response = await fetch('/api/resume/analyze', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze resume');
      }
      
      return data;
    },
    {
      onSuccess: (data) => {
        setOriginalResumeData(data.data);
        setResumeResponse(data);
        setError(null);
      },
      onError: (error) => {
        setError(error.message);
      }
    }
  );

  const scoreOperation = useAsyncOperation(
    async (...args: unknown[]) => {
      const [file, jobDescription] = args as [File, string];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('job', jobDescription);

      const response = await fetch('/api/resume/score', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to score resume');
      }
      
      return data;
    },
    {
      onSuccess: (scoreData) => {
        setScoreResult(scoreData);
        setIsScoring(false);
        setError(null);
      },
      onError: (error) => {
        setError(error.message);
        setIsScoring(false);
      }
    }
  );

  const optimizeOperation = useAsyncOperation(
    async (...args: unknown[]) => {
      const [resumeData, jobDescription] = args as [ResumeData, string];
      const response = await fetch('/api/resume/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData,
          jobDescription
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to optimize resume');
      }
      
      return data.optimizedResume;
    },
    {
      onSuccess: (optimizedData) => {
        setOptimizedResume(optimizedData);
        setShowOptimized(true);
        setError(null);
      },
      onError: (error) => {
        setError(error.message);
      }
    }
  );

  // Redirect to login if not authenticated
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <Sparkles className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to access the resume dashboard.</p>
            <Button 
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!file || !jobDescription.trim()) {
      setError("Please upload a resume and provide a job description");
      return;
    }

    setError(null);
    setOriginalResumeData(null);
    setScoreResult(null);
    setShowOptimized(false);
    setOptimizedResume(null);
    setIsScoring(true);

    try {
      // First, analyze the resume - this shows immediately
      await analyzeOperation.execute(file, jobDescription.trim());
      
      // Then, score the resume in background - this can load while user sees analyzed resume
      scoreOperation.execute(file, jobDescription.trim());
      
    } catch (err) {
      console.error('Error analyzing resume:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsScoring(false);
    }
  };

  const handleOptimizeResume = async () => {
    if (!originalResumeData || !jobDescription.trim()) {
      setError("Missing resume data or job description");
      return;
    }

    setError(null);
    await optimizeOperation.execute(originalResumeData, jobDescription.trim());
  };

  const handleDownloadPdf = async (editableResume?: ResumeData) => {
    const currentResume = showOptimized ? optimizedResume : originalResumeData;
    if (currentResume && resumeResponse) {
      try {
        const safeResponse = {
          ...currentResume,
          summary: currentResume.summary || "",
          skills: currentResume.skills || {},
          work_experience: currentResume.work_experience || [],
          education: currentResume.education || [],
          projects: currentResume.projects || [],
          certifications: currentResume.certifications || []
        };
        
        const mergedData = { ...safeResponse };
        if (editableResume) {
          if (editableResume.summary) mergedData.summary = editableResume.summary;
          if (editableResume.skills) mergedData.skills = editableResume.skills;
          if (editableResume.work_experience) mergedData.work_experience = editableResume.work_experience;
          if (editableResume.education) mergedData.education = editableResume.education;
          if (editableResume.projects) mergedData.projects = editableResume.projects;
          if (editableResume.certifications) mergedData.certifications = editableResume.certifications;
        }
        
        await downloadPdf(mergedData, resumeResponse);
      } catch (error) {
        console.error("Error generating PDF:", error);
      }
    }
  };

  const handleReset = () => {
    setFile(null);
    setJobDescription("");
    setOriginalResumeData(null);
    setOptimizedResume(null);
    setScoreResult(null);
    setShowOptimized(false);
    setError(null);
    setIsScoring(false);
    analyzeOperation.reset();
    scoreOperation.reset();
    optimizeOperation.reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const currentResumeData = showOptimized ? optimizedResume : originalResumeData;
  const isLoading = analyzeOperation.isLoading || optimizeOperation.isLoading;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 p-2 sm:p-4 md:p-6 pt-16 md:pt-6 overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto">
          {/* Header - Mobile Optimized */}
          <div className="text-center mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl text-black font-bold mb-1 sm:mb-2">Resume Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600 px-2 sm:px-0">Upload your resume and job description to get an optimized resume with instant scoring</p>
          </div>
          
          {/* Upload Form - Mobile Optimized */}
          {!currentResumeData && !isLoading && (
            <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6">
                  <ErrorBoundary fallback={
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                      <p className="text-red-800 text-sm">Error loading upload form. Please refresh the page.</p>
                    </div>
                  }>
                    <ResumeUploadForm
                      file={file}
                      setFile={setFile}
                      jobDescription={jobDescription}
                      setJobDescription={setJobDescription}
                      isScoring={false}
                      fileInputRef={fileInputRef}
                      onSubmit={handleSubmit}
                      submitButtonText="Analyze & Score Resume"
                      submitButtonIcon={<Sparkles className="h-4 w-4 mr-1 sm:mr-2" />}
                    />
                  </ErrorBoundary>
                </div>
              </div>
            </div>
          )}

          {/* Loading State - Mobile Optimized */}
          {isLoading && !currentResumeData && (
            <div className="max-w-4xl mx-auto">
              <LoadingState type="optimizing" />
            </div>
          )}

          {/* Analysis Results Layout - Mobile Optimized */}
          {currentResumeData && (
            <div className="flex flex-col lg:flex-row lg:gap-6 min-h-[calc(100vh-200px)]">
              {/* Left Column - Resume Data */}
              <div className="w-full lg:w-[60%] mb-4 sm:mb-6 lg:mb-0">
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden h-full">
                  {/* Header - Mobile Optimized */}
                  <div className="p-3 sm:p-4 bg-white border-b">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 flex-shrink-0" />
                        <h2 className="text-sm sm:text-lg font-semibold text-black truncate">
                          {showOptimized ? "Optimized Resume" : "Current Resume Analysis"}
                        </h2>
                        {showOptimized && (
                          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full whitespace-nowrap">
                            ✨ Optimized
                          </span>
                        )}
                      </div>
                      
                      {/* Action Buttons - Mobile Optimized */}
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        {optimizedResume && originalResumeData && (
                          <button
                            onClick={() => setShowOptimized(!showOptimized)}
                            className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 transition-colors border border-blue-200 px-2 sm:px-3 py-1 rounded-md hover:bg-blue-50 whitespace-nowrap"
                          >
                            {showOptimized ? "View Original" : "View Optimized"}
                          </button>
                        )}
                        {!showOptimized && (
                          <button
                            onClick={handleOptimizeResume}
                            disabled={optimizeOperation.isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium py-1.5 sm:py-2 px-2 sm:px-4 rounded-lg transition-colors disabled:bg-blue-300 whitespace-nowrap"
                          >
                            {optimizeOperation.isLoading ? (
                              <>
                                <div className="h-3 w-3 sm:h-4 sm:w-4 mr-1 inline animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                <span className="hidden sm:inline">Optimizing...</span>
                                <span className="sm:hidden">...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 inline" />
                                <span className="hidden sm:inline">Optimize Resume</span>
                                <span className="sm:hidden">Optimize</span>
                              </>
                            )}
                          </button>
                        )}
                        <button
                          onClick={handleReset}
                          className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors whitespace-nowrap"
                        >
                          <span className="hidden sm:inline">Start Over</span>
                          <span className="sm:hidden">Reset</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Optimization Status - Mobile Optimized */}
                  {optimizeOperation.isLoading && (
                    <div className="p-3 sm:p-4 bg-blue-50 border-b">
                      <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                        <span className="text-blue-800 text-xs sm:text-sm">Optimizing your resume...</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Resume Content - Mobile Optimized */}
                  <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(100vh-300px)]">
                    <ErrorBoundary fallback={
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                        <p className="text-red-800 text-sm">Error displaying resume. Please try again.</p>
                      </div>
                    }>
                      <ResumeEditProvider key={showOptimized ? 'optimized' : 'analyzed'} initialData={currentResumeData}>
                        <OptimizedResume
                          response={currentResumeData}
                          handleDownloadPdf={handleDownloadPdf}
                          isPdfGenerating={isPdfGenerating}
                        />
                      </ResumeEditProvider>
                    </ErrorBoundary>
                  </div>
                </div>
              </div>

              {/* Right Column - Score Result - Mobile Optimized */}
              <div className="w-full lg:w-[40%]">
                <ErrorBoundary fallback={
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                    <p className="text-red-800 text-sm">Error displaying score results.</p>
                  </div>
                }>
                  {isScoring && !scoreResult ? (
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
                      <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                        <div className="h-4 w-4 sm:h-5 sm:w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                        <span className="text-gray-600 text-sm sm:text-base">Scoring your resume...</span>
                      </div>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                      </div>
                    </div>
                  ) : scoreResult ? (
                    <DashboardScoreResult
                      scoreResult={scoreResult}
                      onStartOverAction={handleReset}
                      showOptimizeButton={!showOptimized}
                      onOptimize={handleOptimizeResume}
                      isOptimizing={optimizeOperation.isLoading}
                    />
                  ) : (
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
                      <div className="text-center text-gray-500 text-sm sm:text-base">
                        Score will appear here once analysis is complete
                      </div>
                    </div>
                  )}
                </ErrorBoundary>
              </div>
            </div>
          )}

          {/* Empty State - Mobile Optimized */}
          {!currentResumeData && !isLoading && (
            <div className="max-w-2xl mx-auto text-center py-8 sm:py-12 px-4 sm:px-0">
              <div className="p-3 sm:p-4 bg-blue-50 rounded-full mb-4 sm:mb-6 w-fit mx-auto">
                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Ready to Analyze Your Resume?</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Upload your resume and job description above to get an analysis of your current resume performance.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-left">
                <div className="bg-white p-3 sm:p-4 rounded-lg border">
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="font-medium text-gray-900 text-sm sm:text-base">Instant Analysis</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">AI-powered resume analysis tailored to your target job</p>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-lg border">
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="font-medium text-gray-900 text-sm sm:text-base">Detailed Scoring</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">Get match percentage and missing skills analysis</p>
                </div>
              </div>
            </div>
          )}
          
          {error && <ErrorMessage message={error} className="mt-3 sm:mt-4 max-w-2xl mx-auto" />}
        </div>
      </div>
    </div>
  );
} 