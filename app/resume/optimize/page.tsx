"use client";

import { FileText } from "lucide-react";
import React, { FormEvent, useState } from "react";
import { SaveResumeDialog } from "../../../components/features/resume/SaveResumeDialog";
import Sidebar from "../../../components/layout/Sidebar";
import { ErrorBoundary } from "../../../components/ui/feedback/ErrorBoundary";
import { useToast } from "../../../components/ui/feedback/use-toast";
import { useAuth } from "../../../context/AuthContext";
import { useSavedResumes } from "../../../hooks/api/useSavedResumes";
import { SaveResumeRequest } from "../../../types/api/savedResume";
import ErrorMessage from "./components/ErrorMessage";
import LoadingState from "./components/LoadingState";
import OptimizedResume from "./components/OptimizedResume";
import ResumeUploadForm from "./components/ResumeUploadForm";
import ScoreResult from "./components/ScoreResult";
import { ResumeEditProvider } from "./context/ResumeEditContext";
import { usePdfGenerator } from "./hooks/usePdfGenerator";
import { useResumeOptimizer } from "./hooks/useResumeOptimizer";
import { ResumeData } from "./types";

interface UpdatedResumeData {
  success: boolean;
  message: string;
  updatedResume: unknown;
  addedExperience: unknown;
  summary: string;
  skills: {
    technical_skills?: string[];
    [key: string]: string[] | undefined;
  };
  work_experience: unknown[];
  education: unknown[];
  certifications: string[];
  projects: unknown[];
  contact_details: {
    name: string;
    email: string;
    phone_number: string;
    location: string;
  };
}

export default function OptimizeResume() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { saveResume } = useSavedResumes();
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const {
    file,
    setFile,
    jobDescription,
    setJobDescription,
    response,
    loading,
    error,
    scoreResult,
    setScoreResult,
    scoringMode,
    isScoring,
    fileInputRef,
    resumeResponse,
    handleScoreSubmit,
    handleOptimize,
  } = useResumeOptimizer();

  // Use a single PDF generator instance for the entire page
  const pdfGenerator = usePdfGenerator();
  const { isPdfGenerating, downloadPdf, selectedTemplate } = pdfGenerator;

  const handleDownloadPdf = async (editableResume?: ResumeData) => {
    console.log('handleDownloadPdf called with current selectedTemplate:', selectedTemplate);
    
    if (response && resumeResponse) {
      try {
        // Create a deep copy and ensure all required fields exist
        const safeResponse = {
          ...response,
          summary: response.summary || "",
          skills: response.skills || {},
          work_experience: response.work_experience || [],
          education: response.education || [],
          projects: response.projects || [],
          certifications: response.certifications || []
        };
        
        // Only merge fields that exist in editableResume
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

  const handleSaveResume = async (request: SaveResumeRequest) => {
    if (!response || !user?.id) {
      return { success: false, error: 'No resume data or user not authenticated' };
    }

    try {
      // Transform the optimized resume data to match the expected format
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
        summary: response.summary || '',
        skills: {
          technical_skills: response.skills?.technical_skills || [],
          soft_skills: response.skills?.soft_skills || [],
          ...response.skills
        },
        work_experience: (response.work_experience || []).map(exp => ({
          company: exp.company || '',
          title: exp.title || exp.role || '',
          role: exp.role || exp.title || '',
          dates: exp.dates || exp.date_range || '',
          date_range: exp.date_range || exp.dates || '',
          accomplishments: exp.accomplishments || exp.bullets || [],
          bullets: exp.bullets || exp.accomplishments || []
        })),
        education: (response.education || []).map(edu => {
          const eduData = edu as unknown as Record<string, unknown>;
          return {
            institution: (eduData.school as string) || (eduData.institution as string) || '',
            degree: edu.degree || '',
            graduationDate: (eduData.dates as string) || (eduData.graduation_date as string) || (eduData.graduationDate as string) || ''
          };
        }),
        projects: (response.projects || []).map(proj => ({
          title: proj.title || '',
          description: proj.description || '',
          technologies: Array.isArray(proj.technologies) ? proj.technologies.join(', ') : (proj.technologies || '')
        })),
        certifications: response.certifications || []
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

  const handleWorkExperienceAdded = (updatedResumeData: UpdatedResumeData) => {
    // Clear the score result to allow re-scoring with updated resume
    setScoreResult(null);
    
    // Show a success message
    console.log('Work experience added successfully:', updatedResumeData.message);
    
    // Note: The user will need to re-upload and score the resume with the new experience
    // The AddWorkExperienceForm component will handle showing the success state and instructions
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
        <div className="hidden md:block w-64 bg-gray-200 animate-pulse"></div>
        <div className="flex-1 p-4 md:p-6 pt-16 md:pt-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-4">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mx-auto"></div>
            </div>
            
            <div className="flex flex-col md:flex-row md:gap-6 min-h-[calc(100vh-64px)]">
              {/* Left Column Skeleton */}
              <div className="w-full md:w-[40%] flex flex-col space-y-6">
                {/* Upload Form Skeleton */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="space-y-4">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-32 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-24 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              {/* Right Column Skeleton */}
              <div className="w-full md:w-[60%] mt-6 md:mt-0">
                <div className="bg-white rounded-xl shadow-sm p-6 h-full">
                  <div className="flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mb-4"></div>
                    <div className="h-6 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-80 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 pt-16 md:pt-8 overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto">
          {/* Enhanced Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-sm font-medium text-blue-700 mb-4">
              <FileText className="h-4 w-4 mr-2" />
              AI-Powered Resume Optimization
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Optimize Your Resume
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get personalized recommendations and boost your chances of landing your dream job
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:gap-8 min-h-[calc(100vh-200px)]">
            {/* Left Column - Upload Form + Score Result */}
            <div className="w-full lg:w-[42%] flex flex-col space-y-6">
              {/* Resume Upload Form */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 md:p-8">
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
                      isScoring={isScoring}
                      fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
                      onSubmit={(e: FormEvent<Element>) => handleScoreSubmit(e as FormEvent<HTMLFormElement>)}
                    />
                  </ErrorBoundary>
                </div>
              </div>
              
              {/* Score Result */}
              {scoreResult && !isScoring && (
                <div className="w-full animate-fadeIn">
                  <ErrorBoundary fallback={
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800">Error displaying score results.</p>
                    </div>
                  }>
                    <ScoreResult
                      scoreResult={scoreResult}
                      handleOptimize={handleOptimize}
                      loading={loading}
                      setScoreResult={setScoreResult}
                      file={file}
                      jobDescription={jobDescription}
                      onWorkExperienceAdded={handleWorkExperienceAdded}
                    />
                  </ErrorBoundary>
                </div>
              )}
            </div>

            {/* Right Column - Results Display */}
            <div className="w-full lg:w-[58%] mt-6 lg:mt-0 flex flex-col">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex-1 flex flex-col min-h-[600px]">
                <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                  {loading ? (
                    <LoadingState type="optimizing" />
                  ) : isScoring ? (
                    <LoadingState type="scoring" />
                  ) : response && !scoringMode ? (
                    <ErrorBoundary fallback={
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800">Error displaying optimized resume. Please try optimizing again.</p>
                      </div>
                    }>
                      <ResumeEditProvider initialData={response}>
                        <OptimizedResume
                          response={response}
                          handleDownloadPdf={handleDownloadPdf}
                          isPdfGenerating={isPdfGenerating}
                          onSaveResume={() => setShowSaveDialog(true)}
                          pdfGenerator={pdfGenerator}
                        />
                      </ResumeEditProvider>
                    </ErrorBoundary>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-16">
                      <div className="relative mb-8">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-lg opacity-20 animate-pulse"></div>
                        <div className="relative p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                          <FileText className="h-12 w-12 text-white" />
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        Ready to Transform Your Resume?
                      </h3>
                      
                      <p className="text-gray-600 max-w-lg mx-auto mb-8 leading-relaxed">
                        Our AI-powered system will analyze your resume against the job description and provide personalized optimization recommendations.
                      </p>
                      
                      <div className="grid md:grid-cols-2 gap-6 w-full max-w-md">
                        <div className="text-center p-4 bg-gradient-to-b from-blue-50 to-blue-100 rounded-xl">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-white font-bold text-sm">1</span>
                          </div>
                          <p className="text-sm font-medium text-blue-700">Score & Analyze</p>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-b from-purple-50 to-purple-100 rounded-xl">
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-white font-bold text-sm">2</span>
                          </div>
                          <p className="text-sm font-medium text-purple-700">Optimize & Improve</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {error && <ErrorMessage message={error} className="mt-6" />}
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
            description: "Your optimized resume has been saved and can be accessed from your saved resumes.",
          });
        }}
        defaultTitle={`Optimized Resume for ${jobDescription.split(' ').slice(0, 3).join(' ')}...`}
      />
    </div>
  );
}