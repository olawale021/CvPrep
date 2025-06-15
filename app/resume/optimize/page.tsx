"use client";

import { FileText } from "lucide-react";
import React, { FormEvent, useState } from "react";
import { ErrorBoundary } from "../../../components/ui/ErrorBoundary";
import { SaveResumeDialog } from "../../../components/ui/SaveResumeDialog";
import Sidebar from "../../../components/ui/Sidebar";
import { useToast } from "../../../components/ui/use-toast";
import { useAuth } from "../../../context/AuthContext";
import { useSavedResumes } from "../../../hooks/useSavedResumes";
import { SaveResumeRequest } from "../../../types/savedResume";
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
  const { user } = useAuth();
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

  const { isPdfGenerating, downloadPdf } = usePdfGenerator();

  const handleDownloadPdf = async (editableResume?: ResumeData) => {
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

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 pt-16 md:pt-6 overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl text-black font-bold text-center mb-4">Resume Review</h1>
          
          <div className="flex flex-col md:flex-row md:gap-6 min-h-[calc(100vh-64px)] h-full">
            {/* Left Column - Upload Form + Score Result */}
            <div className="w-full md:w-[40%] flex flex-col space-y-6 h-full max-h-[calc(100vh-64px)]">
              {/* Resume Upload Form */}
              <div className="w-full bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6">
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
              {/* Always show ScoreResult if scoreResult exists */}
              {scoreResult && !isScoring && (
                <div className="w-full">
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

            {/* Right Column - Score Results (initially), Optimized Resume, or Loading States */}
            <div className="w-full md:w-[60%] mt-6 md:mt-0 flex flex-col h-full max-h-[calc(100vh-64px)]">
              <div className="w-full bg-white rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col h-full">
                <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
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
                        />
                      </ResumeEditProvider>
                    </ErrorBoundary>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-8">
                      <div className="p-3 bg-blue-50 rounded-full mb-4">
                        <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                      </div>
                      <h3 className="text-base sm:text-lg font-medium text-black mb-2">Two-Step Resume Optimization</h3>
                      <p className="text-sm sm:text-base text-black max-w-md mx-auto">
                        First, score your resume against the job description. Then, optimize your resume to improve your chances of getting noticed.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {error && <ErrorMessage message={error} className="mt-4" />}
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