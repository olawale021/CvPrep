import { Download, Edit, Expand, FileText } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "../../../../components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../../../../components/ui/Dialog";
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
}

export default function OptimizedResume({
  response,
  handleDownloadPdf,
  isPdfGenerating
}: OptimizedResumeProps) {
  const [activeTab, setActiveTab] = useState<string>("summary");
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const resumeContentRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  // Add debug logging to verify data
  useEffect(() => {
    console.log("OptimizedResume component received data:", response);
    console.log("Summary:", response.summary);
    console.log("Skills:", response.skills);
    console.log("Work Experience:", response.work_experience);
  }, [response]);
  
  // Add logging when active tab changes
  useEffect(() => {
    console.log("Active tab changed to:", activeTab);
    console.log("Current resume data available:", {
      summary: response.summary ? "Yes" : "No",
      skills: response.skills && Object.keys(response.skills).length > 0 ? "Yes" : "No",
      work_experience: response.work_experience && response.work_experience.length > 0 ? "Yes" : "No",
      education: response.education && response.education.length > 0 ? "Yes" : "No",
      certifications: response.certifications && response.certifications.length > 0 ? "Yes" : "No",
      projects: response.projects && response.projects.length > 0 ? "Yes" : "No"
    });
  }, [activeTab, response]);

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
  resumeContentRef
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

  // Add debug logging to verify data is accessible
  useEffect(() => {
    console.log("OptimizedResumeContent - editableResume:", editableResume);
  }, [editableResume]);

  // Add logging when active tab changes
  useEffect(() => {
    console.log("Active tab changed to:", activeTab);
    console.log("Current resume data available:", {
      summary: editableResume.summary ? "Yes" : "No",
      skills: editableResume.skills && Object.keys(editableResume.skills).length > 0 ? "Yes" : "No",
      work_experience: editableResume.work_experience && editableResume.work_experience.length > 0 ? "Yes" : "No",
      education: editableResume.education && editableResume.education.length > 0 ? "Yes" : "No",
      certifications: editableResume.certifications && editableResume.certifications.length > 0 ? "Yes" : "No",
      projects: editableResume.projects && editableResume.projects.length > 0 ? "Yes" : "No"
    });
  }, [activeTab, editableResume]);

  return (
    <>
      <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${isEditMode ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
        {/* Global edit mode indicator banner */}
        {isEditMode && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-800 flex items-center justify-center">
            <Edit className="h-4 w-4 mr-2" />
            Edit mode is active — make changes to your resume
          </div>
        )}
        
        {/* Header Section */}
        <div className={`p-3 sm:p-4 bg-white border-b ${isEditMode ? 'bg-blue-50/30' : ''}`}>
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Optimized Resume</h2>
            </div>
            
            {/* Action Buttons - Stack on mobile */}
            <div className="flex flex-wrap gap-2">
              <div className="mt-6 flex justify-center space-x-4">
                <Button
                  variant={isEditMode ? "default" : "outline"}
                  size="default"
                  className={`items-center ${isEditMode ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditMode ? "Done Editing" : "Edit Resume"}
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  className="items-center"
                  onClick={handlePreview}
                  disabled={isPreviewLoading}
                >
                  <Expand className="h-4 w-4 mr-2" />
                  {isPreviewLoading ? "Loading Preview..." : "Preview"}
                </Button>
                <Button
                  variant="default"
                  size="default"
                  className="items-center"
                  onClick={() => handleDownloadPdf(editableResume)}
                  disabled={isPdfGenerating}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isPdfGenerating ? "Generating..." : "Download PDF"}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Add Template Selector */}
        <TemplateSelector 
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
        />
        
        {/* Tabs Section */}
        <div ref={resumeContentRef}>
          {/* Simple Tabs Navigation */}
          <div className={`border-b mb-4 ${isEditMode ? 'bg-blue-50/30' : ''}`}>
            <div className="flex overflow-x-auto">
              <button
                className={`px-4 py-3 text-sm font-medium ${
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
                  className={`px-4 py-3 text-sm font-medium ${
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
                  className={`px-4 py-3 text-sm font-medium ${
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
                  className={`px-4 py-3 text-sm font-medium ${
                    activeTab === "education" 
                      ? "border-b-2 border-blue-600 text-blue-700 bg-blue-50 font-semibold" 
                      : "border-b-2 border-transparent text-gray-600 hover:text-blue-700 hover:border-blue-200"
                  }`}
                  onClick={() => setActiveTab("education")}
                >
                  Education
                </button>
              )}
              
              {(editableResume.certifications && editableResume.certifications.length > 0) && (
                <button
                  className={`px-4 py-3 text-sm font-medium ${
                    activeTab === "certifications" 
                      ? "border-b-2 border-blue-600 text-blue-700 bg-blue-50 font-semibold" 
                      : "border-b-2 border-transparent text-gray-600 hover:text-blue-700 hover:border-blue-200"
                  }`}
                  onClick={() => setActiveTab("certifications")}
                >
                  Certificates
                </button>
              )}
              
              {(editableResume.projects && editableResume.projects.length > 0) && (
                <button
                  className={`px-4 py-3 text-sm font-medium ${
                    activeTab === "projects" 
                      ? "border-b-2 border-blue-600 text-blue-700 bg-blue-50 font-semibold" 
                      : "border-b-2 border-transparent text-gray-600 hover:text-blue-700 hover:border-blue-200"
                  }`}
                  onClick={() => setActiveTab("projects")}
                >
                  Projects
                </button>
              )}
            </div>
          </div>
            
          {/* Tab Content Section */}
          <div className={`p-3 sm:p-6 border border-gray-200 rounded-md bg-white shadow-sm ${isEditMode ? 'bg-blue-50/10' : ''}`}>
            {activeTab === "summary" && (
              <div className="space-y-4">
                <Summary summary={editableResume.summary} isEditMode={isEditMode} />
              </div>
            )}
            
            {activeTab === "skills" && editableResume.skills && Object.keys(editableResume.skills).length > 0 && (
              <div className="space-y-4">
                <Skills skills={editableResume.skills} isEditMode={isEditMode} />
              </div>
            )}
            
            {activeTab === "experience" && editableResume.work_experience && editableResume.work_experience.length > 0 && (
              <div className="space-y-4">
                <WorkExperience work_experience={editableResume.work_experience} isEditMode={isEditMode} />
              </div>
            )}
            
            {activeTab === "education" && editableResume.education && editableResume.education.length > 0 && (
              <div className="space-y-4">
                <Education education={editableResume.education} isEditMode={isEditMode} />
              </div>
            )}
            
            {activeTab === "certifications" && editableResume.certifications && editableResume.certifications.length > 0 && (
              <div className="space-y-4">
                <Certifications certifications={editableResume.certifications} isEditMode={isEditMode} />
              </div>
            )}
            
            {activeTab === "projects" && editableResume.projects && editableResume.projects.length > 0 && (
              <div className="space-y-4">
                <Projects projects={editableResume.projects} isEditMode={isEditMode} />
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-6xl w-full max-h-[90vh] p-2">
          <DialogTitle>Resume Preview</DialogTitle>
          <DialogDescription className="mb-2">
            Preview how your resume will look when downloaded
          </DialogDescription>
          {isPreviewLoading ? (
            <div className="w-full h-[calc(100%-4rem)] flex items-center justify-center bg-gray-50 rounded-md">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600">Generating preview...</p>
              </div>
            </div>
          ) : previewUrl ? (
            <div className="w-full h-[calc(100%-4rem)] overflow-hidden border border-gray-200 rounded-md flex flex-col items-center bg-gray-50 relative">
              <div className="absolute top-2 right-2 z-10 flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-white"
                  onClick={() => window.open(previewUrl, '_blank')}
                >
                  <Expand className="h-4 w-4 mr-1" /> Open in New Tab
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-white"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = previewUrl;
                    link.download = "resume.pdf";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  <Download className="h-4 w-4 mr-1" /> Download
                </Button>
              </div>
              
              {/* Direct iframe with simple fallback strategy */}
              <div className="w-full h-full">
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  style={{backgroundColor: 'white'}}
                  aria-label="PDF Resume Preview"
                />
              </div>
              
              {/* Fallback message that appears beneath iframe */}
              <div className="absolute bottom-0 left-0 right-0 bg-gray-100 p-2 text-center text-sm">
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  If the preview doesn&apos;t appear, click here to open in a new tab
                </a>
              </div>
            </div>
          ) : (
            <div className="w-full h-[calc(100%-4rem)] flex items-center justify-center bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">Could not generate preview</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
