"use client";

import { FileText, Sparkles } from "lucide-react";
import React, { FormEvent, useState } from "react";
import { ErrorBoundary } from "../../../components/ui/ErrorBoundary";
import Sidebar from "../../../components/ui/Sidebar";
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
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [originalResumeData, setOriginalResumeData] = useState<ResumeData | null>(null);
  const [scoreResult, setScoreResult] = useState<ResumeScore | null>(null);
  const [resumeResponse, setResumeResponse] = useState<ResumeResponse | null>(null);
  const [showOptimized, setShowOptimized] = useState(false);
  const [optimizedResume, setOptimizedResume] = useState<ResumeData | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { isPdfGenerating, downloadPdf } = usePdfGenerator();

  // Separate async operations for better UX
  const analyzeOperation = useAsyncOperation(
    async (...args: unknown[]) => {
      const formData = args[0] as FormData;
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
        setOriginalResumeData(data);
        setResumeResponse(data);
      },
      onError: (error) => {
        setError(error.message);
      }
    }
  );

  const scoreOperation = useAsyncOperation(
    async (...args: unknown[]) => {
      const formData = args[0] as FormData;
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
      onSuccess: (data) => {
        setScoreResult(data);
        setIsScoring(false);
      },
      onError: (error) => {
        setError(error.message);
        setIsScoring(false);
      }
    }
  );

  const optimizeOperation = useAsyncOperation(
    async (...args: unknown[]) => {
      const formData = args[0] as FormData;
      const response = await fetch('/api/resume/optimize', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to optimize resume');
      }
      
      return data;
    },
    {
      onSuccess: (data) => {
        setOptimizedResume(data);
        setShowOptimized(true);
        
        // Score the optimized resume in background
        scoreOptimizedResume(data);
      },
      onError: (error) => {
        setError(error.message);
      }
    }
  );

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

    const formData = new FormData();
    formData.append('file', file);
    formData.append('job', jobDescription.trim());

    try {
      // First, analyze the resume - this shows immediately
      await analyzeOperation.execute(formData);
      
      // Then, score the resume in background - this can load while user sees analyzed resume
      scoreOperation.execute(formData);
      
    } catch (err) {
      console.error('Error analyzing resume:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsScoring(false);
    }
  };

  const scoreOptimizedResume = async (optimizedData: ResumeData) => {
    if (!jobDescription.trim()) return;
    
    setIsScoring(true);
    setScoreResult(null);

    try {
      // Create text representation of optimized resume
      const optimizedResumeText = createResumeText(optimizedData);
      const optimizedResumeBlob = new Blob([optimizedResumeText], { type: 'text/plain' });
      const optimizedResumeFile = new File([optimizedResumeBlob], 'optimized_resume.txt', { type: 'text/plain' });
      
      const scoreFormData = new FormData();
      scoreFormData.append('file', optimizedResumeFile);
      scoreFormData.append('job', jobDescription.trim());

      await scoreOperation.execute(scoreFormData);
    } catch (err) {
      console.error('Error scoring optimized resume:', err);
      setError(err instanceof Error ? err.message : 'Failed to score optimized resume');
      setIsScoring(false);
    }
  };

  const handleOptimizeResume = async () => {
    if (!file || !jobDescription.trim()) {
      setError("Missing file or job description");
      return;
    }

    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('job', jobDescription.trim());

    await optimizeOperation.execute(formData);
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

  // Helper function to create resume text from optimized data
  const createResumeText = (resumeData: ResumeData): string => {
    let resumeText = '';
    
    // Contact Details
    if (resumeData.contact_details) {
      const contact = resumeData.contact_details;
      resumeText += `${contact.name || ''}\n`;
      if (contact.email) resumeText += `${contact.email}\n`;
      if (contact.phone) resumeText += `${contact.phone}\n`;
      if (contact.location) resumeText += `${contact.location}\n`;
      resumeText += '\n';
    }
    
    // Summary
    if (resumeData.summary) {
      resumeText += `PROFESSIONAL SUMMARY\n${resumeData.summary}\n\n`;
    }
    
    // Work Experience
    if (resumeData.work_experience && resumeData.work_experience.length > 0) {
      resumeText += 'WORK EXPERIENCE\n';
      resumeData.work_experience.forEach((exp: { title?: string; role?: string; company?: string; dates?: string; date_range?: string; accomplishments?: string[]; bullets?: string[] }) => {
        resumeText += `${exp.title || exp.role || ''} at ${exp.company || ''}\n`;
        if (exp.dates || exp.date_range) {
          resumeText += `${exp.dates || exp.date_range}\n`;
        }
        if (exp.accomplishments || exp.bullets) {
          const achievements = exp.accomplishments || exp.bullets || [];
          achievements.forEach((achievement: string) => {
            resumeText += `• ${achievement}\n`;
          });
        }
        resumeText += '\n';
      });
    }
    
    // Skills
    if (resumeData.skills) {
      resumeText += 'SKILLS\n';
      Object.entries(resumeData.skills).forEach(([category, skillList]) => {
        if (Array.isArray(skillList) && skillList.length > 0) {
          resumeText += `${category.replace('_', ' ').toUpperCase()}:\n`;
          skillList.forEach((skill: string) => {
            resumeText += `• ${skill}\n`;
          });
        }
      });
      resumeText += '\n';
    }
    
    // Education
    if (resumeData.education && resumeData.education.length > 0) {
      resumeText += 'EDUCATION\n';
      resumeData.education.forEach((edu: { degree?: string; school?: string; institution?: string; dates?: string; graduation_date?: string }) => {
        resumeText += `${edu.degree || ''} - ${edu.school || edu.institution || ''}\n`;
        if (edu.dates || edu.graduation_date) {
          resumeText += `${edu.dates || edu.graduation_date}\n`;
        }
        resumeText += '\n';
      });
    }
    
    // Projects
    if (resumeData.projects && resumeData.projects.length > 0) {
      resumeText += 'PROJECTS\n';
      resumeData.projects.forEach((project: { name?: string; title?: string; description?: string; technologies?: string[] | string }) => {
        resumeText += `${project.name || project.title || ''}\n`;
        if (project.description) {
          resumeText += `${project.description}\n`;
        }
        if (project.technologies) {
          resumeText += `Technologies: ${Array.isArray(project.technologies) ? project.technologies.join(', ') : project.technologies}\n`;
        }
        resumeText += '\n';
      });
    }
    
    // Certifications
    if (resumeData.certifications && resumeData.certifications.length > 0) {
      resumeText += 'CERTIFICATIONS\n';
      resumeData.certifications.forEach((cert: string) => {
        resumeText += `• ${cert}\n`;
      });
      resumeText += '\n';
    }
    
    return resumeText;
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 pt-16 md:pt-6 overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl text-black font-bold mb-2">Resume Dashboard</h1>
            <p className="text-gray-600">Upload your resume and job description to get an optimized resume with instant scoring</p>
          </div>
          
          {/* Upload Form */}
          {!currentResumeData && !isLoading && (
            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                  <ErrorBoundary fallback={
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800">Error loading upload form. Please refresh the page.</p>
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
                      submitButtonIcon={<Sparkles className="h-4 w-4 mr-2" />}
                    />
                  </ErrorBoundary>
                </div>
              </div>
            </div>
          )}

          {/* Loading State - Only show when analyzing */}
          {isLoading && !currentResumeData && (
            <div className="max-w-4xl mx-auto">
              <LoadingState type="optimizing" />
            </div>
          )}

          {/* Analysis Results Layout */}
          {currentResumeData && (
            <div className="flex flex-col lg:flex-row lg:gap-6 min-h-[calc(100vh-200px)]">
              {/* Left Column - Resume Data */}
              <div className="w-full lg:w-[60%] mb-6 lg:mb-0">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden h-full">
                  <div className="p-4 bg-white border-b flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <h2 className="text-lg font-semibold text-black">
                        {showOptimized ? "Optimized Resume" : "Current Resume Analysis"}
                      </h2>
                      {showOptimized && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          ✨ Optimized
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {optimizedResume && originalResumeData && (
                        <button
                          onClick={() => setShowOptimized(!showOptimized)}
                          className="text-sm text-blue-600 hover:text-blue-800 transition-colors border border-blue-200 px-3 py-1 rounded-md hover:bg-blue-50"
                        >
                          {showOptimized ? "View Original" : "View Optimized"}
                        </button>
                      )}
                      {!showOptimized && (
                        <button
                          onClick={handleOptimizeResume}
                          disabled={optimizeOperation.isLoading}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors disabled:bg-blue-300"
                        >
                          {optimizeOperation.isLoading ? (
                            <>
                              <div className="h-4 w-4 mr-1 inline animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                              Optimizing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-1 inline" />
                              Optimize Resume
                            </>
                          )}
                        </button>
                      )}
                      <button
                        onClick={handleReset}
                        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Start Over
                      </button>
                    </div>
                  </div>
                  {optimizeOperation.isLoading && (
                    <div className="p-4 bg-blue-50 border-b">
                      <div className="flex items-center justify-center space-x-3">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                        <span className="text-blue-800 text-sm">Optimizing your resume...</span>
                      </div>
                    </div>
                  )}
                  <div className="p-6 overflow-y-auto max-h-[calc(100vh-300px)]">
                    <ErrorBoundary fallback={
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800">Error displaying resume. Please try again.</p>
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

              {/* Right Column - Score Result */}
              <div className="w-full lg:w-[40%]">
                <ErrorBoundary fallback={
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">Error displaying score results.</p>
                  </div>
                }>
                  {isScoring && !scoreResult ? (
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <div className="flex items-center justify-center space-x-3 mb-4">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                        <span className="text-gray-600">Scoring your resume...</span>
                      </div>
                      <div className="space-y-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
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
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <div className="text-center text-gray-500">
                        Score will appear here once analysis is complete
                      </div>
                    </div>
                  )}
                </ErrorBoundary>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!currentResumeData && !isLoading && (
            <div className="max-w-2xl mx-auto text-center py-12">
              <div className="p-4 bg-blue-50 rounded-full mb-6 w-fit mx-auto">
                <Sparkles className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Ready to Analyze Your Resume?</h3>
              <p className="text-gray-600 mb-6">
                Upload your resume and job description above to get an analysis of your current resume performance.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="font-medium text-gray-900">Instant Analysis</span>
                  </div>
                  <p className="text-sm text-gray-600">AI-powered resume analysis tailored to your target job</p>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="font-medium text-gray-900">Detailed Scoring</span>
                  </div>
                  <p className="text-sm text-gray-600">Get match percentage and missing skills analysis</p>
                </div>
              </div>
            </div>
          )}
          
          {error && <ErrorMessage message={error} className="mt-4 max-w-2xl mx-auto" />}
        </div>
      </div>
    </div>
  );
} 