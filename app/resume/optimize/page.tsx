"use client";

import { FileText } from "lucide-react";
import React, { FormEvent } from "react";
import { ErrorBoundary } from "../../../components/ui/ErrorBoundary";
import Sidebar from "../../../components/ui/Sidebar";
import ErrorMessage from "./components/ErrorMessage";
import LoadingState from "./components/LoadingState";
import OptimizedResume from "./components/OptimizedResume";
import ResumeUploadForm from "./components/ResumeUploadForm";
import ScoreResult from "./components/ScoreResult";
import { ResumeEditProvider } from "./context/ResumeEditContext";
import { usePdfGenerator } from "./hooks/usePdfGenerator";
import { useResumeOptimizer } from "./hooks/useResumeOptimizer";
import { ResumeData } from "./types";

export default function OptimizeResume() {
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

  const { isPdfGenerating, downloadPdf, setIsPdfGenerating, error: pdfError } = usePdfGenerator();

  const handleDownloadPdf = async (editableResume?: ResumeData) => {
    if (response && resumeResponse) {
      setIsPdfGenerating(true);
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
      } finally {
        setIsPdfGenerating(false);
      }
    }
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
            <div className="w-full md:w-[40%] flex flex-col space-y-6 h-full">
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
                    />
                  </ErrorBoundary>
                </div>
              )}
            </div>

            {/* Right Column - Score Results (initially), Optimized Resume, or Loading States */}
            <div className="w-full md:w-[60%] mt-6 md:mt-0 flex flex-col h-full">
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
          {pdfError && <ErrorMessage message={pdfError} className="mt-4" />}
        </div>
      </div>
    </div>
  );
}