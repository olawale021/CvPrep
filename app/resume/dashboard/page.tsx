"use client";

import { FileText, Sparkles } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { SaveResumeDialog } from "../../../components/features/resume/SaveResumeDialog";
import Sidebar from "../../../components/layout/Sidebar";
import { Button } from "../../../components/ui/base/Button";
import { ErrorBoundary } from "../../../components/ui/feedback/ErrorBoundary";
import { useToast } from "../../../components/ui/feedback/use-toast";
import { useAuth } from "../../../context/AuthContext";
import { useSavedResumes } from "../../../hooks/api/useSavedResumes";
import { useAsyncOperation } from "../../../hooks/ui/useAsyncOperation";
import { supabase } from "../../../lib/auth/supabaseClient";
import { ResumeScore } from "../../../lib/services/resume/scoreResume";
import { SaveResumeRequest } from "../../../types/api/savedResume";
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
  const { toast } = useToast();
  const { saveResume } = useSavedResumes();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>("");
  const [originalResumeData, setOriginalResumeData] = useState<ResumeData | null>(null);
  const [optimizedResume, setOptimizedResume] = useState<ResumeData | null>(null);
  const [resumeResponse, setResumeResponse] = useState<ResumeResponse | null>(null);
  const [scoreResult, setScoreResult] = useState<ResumeScore | null>(null);
  const [optimizedScoreResult, setOptimizedScoreResult] = useState<ResumeScore | null>(null);
  const [showOptimized, setShowOptimized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use a single PDF generator instance for the entire page
  const pdfGenerator = usePdfGenerator();
  const { isPdfGenerating, downloadPdf, selectedTemplate } = pdfGenerator;

  // All async operations
  const analyzeOperation = useAsyncOperation(
    async (...args: unknown[]) => {
      const [file, jobDescription] = args as [File, string];
      
      // Get the session token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('job', jobDescription);

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/resume/analyze', {
        method: 'POST',
        body: formData,
        headers
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
      
      // Get the session token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('job', jobDescription);

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/resume/score', {
        method: 'POST',
        body: formData,
        headers
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
      const [file, jobDescription] = args as [File, string];
      
      // Get the session token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('job', jobDescription);
      
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/resume/optimize', {
        method: 'POST',
        headers,
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to optimize resume');
      }
      
      return data;
    },
    {
      onSuccess: (optimizedData) => {
        setOptimizedResume(optimizedData);
        setShowOptimized(true);
        setError(null);
        // Automatically score the optimized resume
        scoreOptimizedResume(optimizedData, jobDescription);
      },
      onError: (error) => {
        setError(error.message);
      }
    }
  );

  // Function to score optimized resume
  const scoreOptimizedResume = async (optimizedData: ResumeData, jobDesc: string) => {
    try {
      // Get the session token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      // Create a text representation of the optimized resume
      const resumeText = createResumeText(optimizedData);
      const resumeBlob = new Blob([resumeText], { type: 'text/plain' });
      const resumeFile = new File([resumeBlob], 'optimized_resume.txt', { type: 'text/plain' });
      
      const formData = new FormData();
      formData.append('file', resumeFile);
      formData.append('job', jobDesc);

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/resume/score', {
        method: 'POST',
        body: formData,
        headers
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setOptimizedScoreResult(data);
      }
    } catch (error) {
      console.error('Error scoring optimized resume:', error);
    }
  };

  // Helper function to create resume text from ResumeData
  const createResumeText = (resumeData: ResumeData): string => {
    let resumeText = '';
    
    if (resumeData.summary) {
      resumeText += `SUMMARY\n${resumeData.summary}\n\n`;
    }
    
    if (resumeData.work_experience && resumeData.work_experience.length > 0) {
      resumeText += 'WORK EXPERIENCE\n';
      resumeData.work_experience.forEach((exp) => {
        resumeText += `${exp.title || exp.role || 'Position'} at ${exp.company}\n`;
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
    
    if (resumeData.skills && resumeData.skills.technical_skills) {
      resumeText += 'SKILLS\n';
      resumeData.skills.technical_skills.forEach((skill: string) => {
        resumeText += `• ${skill}\n`;
      });
      resumeText += '\n';
    }
    
    if (resumeData.education && resumeData.education.length > 0) {
      resumeText += 'EDUCATION\n';
      resumeData.education.forEach((edu) => {
        resumeText += `${edu.degree} - ${edu.school || 'Institution'}\n`;
        if (edu.dates) {
          resumeText += `${edu.dates}\n`;
        }
        resumeText += '\n';
      });
    }
    
    if (resumeData.projects && resumeData.projects.length > 0) {
      resumeText += 'PROJECTS\n';
      resumeData.projects.forEach((project) => {
        resumeText += `${project.title || 'Project'}\n`;
        if (project.description) {
          resumeText += `${project.description}\n`;
        }
        if (project.technologies && project.technologies.length > 0) {
          resumeText += `Technologies: ${project.technologies.join(', ')}\n`;
        }
        resumeText += '\n';
      });
    }
    
    if (resumeData.certifications && resumeData.certifications.length > 0) {
      resumeText += 'CERTIFICATIONS\n';
      resumeData.certifications.forEach((cert: string) => {
        resumeText += `• ${cert}\n`;
      });
    }
    
    return resumeText;
  };

  // Redirect to login if not authenticated
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mx-auto"></div>
          </div>
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
    if (!file || !jobDescription.trim()) {
      setError("Missing original file or job description");
      return;
    }

    setError(null);
    await optimizeOperation.execute(file, jobDescription.trim());
  };

  const handleDownloadPdf = async (editableResume?: ResumeData) => {
    console.log('Dashboard handleDownloadPdf called with selectedTemplate:', selectedTemplate);
    
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
    setOptimizedScoreResult(null);
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

  const handleSaveResume = async (request: SaveResumeRequest) => {
    const currentResume = showOptimized ? optimizedResume : originalResumeData;
    if (!currentResume || !user?.id) {
      return { success: false, error: 'No resume data or user not authenticated' };
    }

    try {
      // Transform the resume data to match the expected format
      const transformedFormData = {
        jobDescription: jobDescription || '',
        currentSummary: '',
        workExperience: [],
        education: [],
        projects: [],
        certifications: '',
        licenses: ''
      };

      // Transform generated data to match the expected format
      const transformedGeneratedData = {
        summary: currentResume.summary || '',
        skills: {
          technical_skills: currentResume.skills?.technical_skills || [],
          soft_skills: currentResume.skills?.soft_skills || [],
          ...currentResume.skills
        },
        work_experience: (currentResume.work_experience || []).map(exp => ({
          company: exp.company || '',
          title: exp.title || exp.role || '',
          role: exp.role || exp.title || '',
          dates: exp.dates || exp.date_range || '',
          date_range: exp.date_range || exp.dates || '',
          accomplishments: exp.accomplishments || exp.bullets || [],
          bullets: exp.bullets || exp.accomplishments || []
        })),
        education: (currentResume.education || []).map(edu => {
          const eduData = edu as unknown as Record<string, unknown>;
          return {
            institution: (eduData.school as string) || (eduData.institution as string) || '',
            degree: edu.degree || '',
            graduationDate: (eduData.dates as string) || (eduData.graduation_date as string) || (eduData.graduationDate as string) || ''
          };
        }),
        projects: (currentResume.projects || []).map(proj => ({
          title: proj.title || '',
          description: proj.description || '',
          technologies: Array.isArray(proj.technologies) ? proj.technologies.join(', ') : (proj.technologies || '')
        })),
        certifications: currentResume.certifications || []
      };

      const saveRequest: SaveResumeRequest = {
        title: request.title,
        formData: transformedFormData,
        generatedData: transformedGeneratedData,
        isPrimary: request.isPrimary,
        isFavorite: request.isFavorite
      };

      const result = await saveResume(saveRequest);
      return result;
    } catch (error) {
      console.error('Error saving resume:', error);
      return { success: false, error: 'Failed to save resume' };
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
                                <div className="h-3 w-3 sm:h-4 sm:w-4 mr-1 inline bg-white/30 rounded animate-pulse"></div>
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
                        <div className="h-4 w-4 bg-blue-600 rounded animate-pulse"></div>
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
                          onSaveResume={() => setShowSaveDialog(true)}
                          pdfGenerator={pdfGenerator}
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
                        <div className="h-4 w-4 sm:h-5 sm:w-5 bg-blue-600 rounded animate-pulse"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                      </div>
                    </div>
                  ) : scoreResult ? (
                    <DashboardScoreResult
                      scoreResult={showOptimized && optimizedScoreResult ? optimizedScoreResult : scoreResult}
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

      {/* Save Resume Dialog */}
      <SaveResumeDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveResume}
        onSuccess={() => {
          toast({
            title: "Resume Saved Successfully!",
            description: `Your ${showOptimized ? 'optimized' : 'analyzed'} resume has been saved and can be accessed from your saved resumes.`,
          });
        }}
        defaultTitle={`${showOptimized ? 'Optimized' : 'Analyzed'} Resume for ${jobDescription.split(' ').slice(0, 3).join(' ')}...`}
      />
    </div>
  );
} 