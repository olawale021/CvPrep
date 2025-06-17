import { Download, Edit, Expand, FileText, Save } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "../../../../components/ui/base/Button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../../../../components/ui/composite/Dialog";
import { ResumeEditProvider, useResumeEdit } from "../context/ResumeEditContext";
import { usePdfGenerator } from "../hooks/usePdfGenerator";
import { ResumeData, ResumeResponse } from "../types";
import Certifications from "./sections/Certifications";
import Education from "./sections/Education";
import Projects from "./sections/Projects";
import Skills from "./sections/Skills";
import Summary from "./sections/Summary";
import WorkExperience from "./sections/WorkExperience";
import TemplateSelector from "./TemplateSelector";

interface OptimizedResumeProps {
  response: ResumeData;
  handleDownloadPdf: (editableResume?: ResumeData) => void;
  isPdfGenerating: boolean;
  onSaveResume?: () => void;
}

interface OptimizedResumeContentProps {
  response: ResumeData;
  handleDownloadPdf: (editableResume?: ResumeData) => void;
  isPdfGenerating: boolean;
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void;
  activeTab: string;
  setActiveTab: (value: string) => void;
  resumeContentRef: React.RefObject<HTMLDivElement | null>;
  onSaveResume?: () => void;
}

export default function OptimizedResume({
  response,
  handleDownloadPdf,
  isPdfGenerating,
  onSaveResume
}: OptimizedResumeProps) {
  const [activeTab, setActiveTab] = useState<string>("summary");
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const resumeContentRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  // Add debug logging to verify data
  useEffect(() => {
    
  }, [response]);
  


  return (
    <ResumeEditProvider initialData={response}>
      <OptimizedResumeContent 
        response={response}
        handleDownloadPdf={handleDownloadPdf}
        isPdfGenerating={isPdfGenerating}
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        resumeContentRef={resumeContentRef}
        onSaveResume={onSaveResume}
      />
    </ResumeEditProvider>
  );
}

function OptimizedResumeContent({
  response,
  handleDownloadPdf,
  isPdfGenerating,
  isEditMode,
  setIsEditMode,
  activeTab,
  setActiveTab,
  resumeContentRef,
  onSaveResume
}: OptimizedResumeContentProps) {
  const { editableResume } = useResumeEdit();
  const { generatePreview, previewUrl, selectedTemplate, setSelectedTemplate } = usePdfGenerator();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  
  const handlePreview = async () => {
    setIsPreviewLoading(true);
    const resumeResponse = {
      data: editableResume,
      original: response
    } as ResumeResponse;
    await generatePreview(editableResume, resumeResponse);
    setIsPreviewOpen(true);
    setIsPreviewLoading(false);
  };



  return (
    <>
      <div className={`bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden h-full flex flex-col ${isEditMode ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
        {/* Global edit mode indicator banner - Mobile Optimized */}
        {isEditMode && (
          <div className="bg-blue-50 border-b border-blue-200 p-3 sm:p-6 text-xs sm:text-sm text-blue-800 flex items-center justify-center">
            <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Edit mode is active — make changes to your resume</span>
            <span className="sm:hidden">Edit mode active</span>
          </div>
        )}
        
        {/* Header Section - Mobile Optimized */}
        <div className={`p-3 sm:p-6 bg-white border-b ${isEditMode ? 'bg-blue-50/30' : ''}`}>
          <div className="flex flex-col space-y-2 sm:space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              <h2 className="text-base sm:text-lg font-semibold text-black">Optimized Resume</h2>
            </div>
            
            {/* Action Buttons - Mobile Optimized */}
            <div className="w-full md:w-auto flex justify-start gap-1 sm:gap-2 overflow-x-auto pb-1 sm:pb-2">
              <Button
                variant={isEditMode ? "default" : "outline"}
                size="sm"
                className={`whitespace-nowrap items-center text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 ${isEditMode ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                onClick={() => setIsEditMode(!isEditMode)}
              >
                <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{isEditMode ? "Done Editing" : "Edit Resume"}</span>
                <span className="sm:hidden">{isEditMode ? "Done" : "Edit"}</span>
              </Button>
              {onSaveResume && (
                <Button
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap items-center text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                  onClick={onSaveResume}
                >
                  <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Save Resume</span>
                  <span className="sm:hidden">Save</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="whitespace-nowrap items-center text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                onClick={handlePreview}
                disabled={isPreviewLoading}
              >
                <Expand className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{isPreviewLoading ? "Loading Preview..." : "Preview"}</span>
                <span className="sm:hidden">{isPreviewLoading ? "Loading..." : "Preview"}</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                className="whitespace-nowrap items-center text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                onClick={() => handleDownloadPdf(editableResume)}
                disabled={isPdfGenerating}
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{isPdfGenerating ? "Generating..." : "Download PDF"}</span>
                <span className="sm:hidden">{isPdfGenerating ? "..." : "PDF"}</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Template Selector - Mobile Optimized */}
        <div className="px-3 sm:px-6 py-2 sm:py-4">
          <TemplateSelector 
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
          />
        </div>
        
        {/* Tabs Section - Mobile Optimized */}
        <div ref={resumeContentRef} className="flex-1 flex flex-col">
          {/* Simple Tabs Navigation - Mobile Optimized */}
          <div className={`border-b ${isEditMode ? 'bg-blue-50/30' : ''}`}>
            <div className="flex overflow-x-auto px-3 sm:px-6 scrollbar-hide">
              <button
                className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap ${
                  activeTab === "summary" 
                    ? "border-b-2 border-blue-600 text-blue-700 bg-blue-50 font-semibold" 
                    : "border-b-2 border-transparent text-gray-600 hover:text-blue-700 hover:border-blue-200"
                }`}
                onClick={() => setActiveTab("summary")}
              >
                Summary
              </button>
              
              {(editableResume.skills && Object.keys(editableResume.skills).length > 0) && (
                <button
                  className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap ${
                    activeTab === "skills" 
                      ? "border-b-2 border-blue-600 text-blue-700 bg-blue-50 font-semibold" 
                      : "border-b-2 border-transparent text-gray-600 hover:text-blue-700 hover:border-blue-200"
                  }`}
                  onClick={() => setActiveTab("skills")}
                >
                  Skills
                </button>
              )}
              
              {(editableResume.work_experience && editableResume.work_experience.length > 0) && (
                <button
                  className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap ${
                    activeTab === "experience" 
                      ? "border-b-2 border-blue-600 text-blue-700 bg-blue-50 font-semibold" 
                      : "border-b-2 border-transparent text-gray-600 hover:text-blue-700 hover:border-blue-200"
                  }`}
                  onClick={() => setActiveTab("experience")}
                >
                  Experience
                </button>
              )}
              
              {(editableResume.education && editableResume.education.length > 0) && (
                <button
                  className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap ${
                    activeTab === "education" 
                      ? "border-b-2 border-blue-600 text-blue-700 bg-blue-50 font-semibold" 
                      : "border-b-2 border-transparent text-gray-600 hover:text-blue-700 hover:border-blue-200"
                  }`}
                  onClick={() => setActiveTab("education")}
                >
                  Education
                </button>
              )}
              
              {(editableResume.projects && editableResume.projects.length > 0) && (
                <button
                  className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap ${
                    activeTab === "projects" 
                      ? "border-b-2 border-blue-600 text-blue-700 bg-blue-50 font-semibold" 
                      : "border-b-2 border-transparent text-gray-600 hover:text-blue-700 hover:border-blue-200"
                  }`}
                  onClick={() => setActiveTab("projects")}
                >
                  Projects
                </button>
              )}
              
              {(editableResume.certifications && editableResume.certifications.length > 0) && (
                <button
                  className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap ${
                    activeTab === "certifications" 
                      ? "border-b-2 border-blue-600 text-blue-700 bg-blue-50 font-semibold" 
                      : "border-b-2 border-transparent text-gray-600 hover:text-blue-700 hover:border-blue-200"
                  }`}
                  onClick={() => setActiveTab("certifications")}
                >
                  Certifications
                </button>
              )}
            </div>
          </div>
          
          {/* Tab Content - Mobile Optimized */}
          <div className={`flex-1 overflow-y-auto p-3 sm:p-6 ${isEditMode ? 'bg-blue-50/10' : ''}`}>
            {activeTab === "summary" && <Summary isEditMode={isEditMode} summary={editableResume.summary} />}
            {activeTab === "skills" && <Skills isEditMode={isEditMode} skills={editableResume.skills} />}
            {activeTab === "experience" && <WorkExperience isEditMode={isEditMode} work_experience={editableResume.work_experience} />}
            {activeTab === "education" && <Education education={editableResume.education} isEditMode={isEditMode} />}
            {activeTab === "projects" && <Projects projects={editableResume.projects} isEditMode={isEditMode} />}
            {activeTab === "certifications" && <Certifications isEditMode={isEditMode} certifications={editableResume.certifications} />}
          </div>
        </div>
      </div>

      {/* Preview Dialog - Enhanced Display */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-6xl h-[95vh] p-4 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900">Resume Preview</DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                Preview your resume before downloading
              </DialogDescription>
            </div>
          </div>
          
          {previewUrl ? (
            <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden shadow-inner">
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title="Resume Preview"
                style={{ minHeight: '600px' }}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg font-medium">Loading Preview...</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
