'use client';

import { Award, Briefcase, FileText, GraduationCap, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { FormEvent, useEffect, useState } from 'react';
import { SaveResumeDialog } from '../../../components/features/resume/SaveResumeDialog';
import Sidebar from '../../../components/layout/Sidebar';
import { Button } from '../../../components/ui/base/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/base/Card';
import { Input } from '../../../components/ui/base/Input';
import { Label } from '../../../components/ui/base/Label';
import { Textarea } from '../../../components/ui/base/Textarea';
import { ErrorBoundary } from '../../../components/ui/feedback/ErrorBoundary';
import { useToast } from '../../../components/ui/feedback/use-toast';
import { useAuth } from '../../../context/AuthContext';
import { useSavedResumes } from '../../../hooks/api/useSavedResumes';
import { useAsyncOperation } from '../../../hooks/ui/useAsyncOperation';
import { supabase } from '../../../lib/auth/supabaseClient';
import { ResumeScore } from '../../../lib/services/resume/scoreResume';
import { SaveResumeRequest } from '../../../types/api/savedResume';
import DashboardScoreResult from '../dashboard/components/DashboardScoreResult';
import ErrorMessage from '../optimize/components/ErrorMessage';
import OptimizedResume from '../optimize/components/OptimizedResume';
import { ResumeEditProvider } from '../optimize/context/ResumeEditContext';
import { usePdfGenerator } from '../optimize/hooks/usePdfGenerator';
import { ResumeData, ResumeResponse } from '../optimize/types';
import { showFeedbackNotification } from '../../../lib/core/utils';

interface WorkExperience {
  company: string;
  title: string;
  dateRange: string;
}

interface Education {
  institution: string;
  degree: string;
  graduationDate: string;
}

interface Project {
  title: string;
  description: string;
  technologies: string;
}

interface CreateResumeFormData {
  // Personal Information
  fullName: string;
  email: string;
  phoneNumber: string;
  location: string;
  // Job and Content
  jobDescription: string;
  currentSummary: string;
  workExperience: WorkExperience[];
  education: Education[];
  projects: Project[];
  certifications: string;
  licenses: string;
}

export default function CreateResumePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState<CreateResumeFormData>({
    // Personal Information
    fullName: '',
    email: user?.email || '',
    phoneNumber: '',
    location: '',
    // Job and Content
    jobDescription: '',
    currentSummary: '',
    workExperience: [{ company: '', title: '', dateRange: '' }],
    education: [{ institution: '', degree: '', graduationDate: '' }],
    projects: [{ title: '', description: '', technologies: '' }],
    certifications: '',
    licenses: ''
  });
  
  const [error, setError] = useState<string | null>(null);
  const [generatedResume, setGeneratedResume] = useState<ResumeData | null>(null);
  const [resumeResponse, setResumeResponse] = useState<ResumeResponse | null>(null);
  const [scoreResult, setScoreResult] = useState<ResumeScore | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const { saveResume } = useSavedResumes();
  const { toast } = useToast();

  // Use a single PDF generator instance for the entire page
  const pdfGenerator = usePdfGenerator();
  const { isPdfGenerating, downloadPdf, selectedTemplate } = pdfGenerator;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Generate resume operation
  const generateOperation = useAsyncOperation(
    async (...args: unknown[]) => {
      const formData = args[0] as CreateResumeFormData;
      
      // Get the session token from Supabase for authentication
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/resume/create', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate resume');
      }

      if (!data.success || !data.resume) {
        throw new Error('Invalid response from server');
      }

      return data.resume;
    },
    {
      onSuccess: (resume) => {
        // Add contact information to the resume data itself
        const resumeWithContact = {
          ...resume,
          contact_details: {
            name: formData.fullName,
            email: formData.email,
            phone: formData.phoneNumber,
            location: formData.location
          }
        };
        
        setGeneratedResume(resumeWithContact);
        // Create resume response with actual contact details
        setResumeResponse({
          data: resumeWithContact,
          original: resumeWithContact,
          contact_details: {
            name: formData.fullName,
            email: formData.email,
            phone_number: formData.phoneNumber,
            location: formData.location
          }
        });
        // Score the generated resume
        scoreGeneratedResume(resumeWithContact);

        // Show feedback notification after successful resume creation
        showFeedbackNotification(toast, "created your professional resume");
      },
      onError: (error) => {
        setError(error.message);
      }
    }
  );
  
  // Show loading while checking auth or redirecting
  if (authLoading || !user) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
        <div className="w-64 bg-gray-200 animate-pulse"></div>
        <div className="flex-1 p-4 md:p-6 pt-16 md:pt-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-8">
                              <div className="space-y-8">
                  {/* Personal Information Skeleton */}
                  <div className="space-y-4">
                    <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Job Description Skeleton */}
                  <div className="space-y-4">
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-32 w-full bg-gray-200 rounded animate-pulse"></div>
                  </div>
                <div className="space-y-4">
                  <div className="h-6 w-36 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-24 w-full bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-20 w-full bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-6 w-28 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-20 w-full bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Generate resume operation
  const scoreGeneratedResume = async (resumeData: ResumeData) => {
    if (!formData.jobDescription.trim()) return;
    
    setIsScoring(true);
    setScoreResult(null);

    try {
      // Get the session token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      // Create text representation of generated resume
      const resumeText = createResumeText(resumeData);
      const resumeBlob = new Blob([resumeText], { type: 'text/plain' });
      const resumeFile = new File([resumeBlob], 'generated_resume.txt', { type: 'text/plain' });
      
      const scoreFormData = new FormData();
      scoreFormData.append('file', resumeFile);
      scoreFormData.append('job', formData.jobDescription.trim());

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/resume/score', {
        method: 'POST',
        body: scoreFormData,
        headers
      });
      
      const scoreData = await response.json();
      
      if (!response.ok) {
        throw new Error(scoreData.error || 'Failed to score generated resume');
      }
      
      setScoreResult(scoreData);
      setIsScoring(false);
    } catch (err) {
      console.error('Error scoring generated resume:', err);
      setError(err instanceof Error ? err.message : 'Failed to score generated resume');
      setIsScoring(false);
    }
  };

  const handleInputChange = (field: keyof CreateResumeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const addWorkExperience = () => {
    setFormData(prev => ({
      ...prev,
      workExperience: [...prev.workExperience, { company: '', title: '', dateRange: '' }]
    }));
  };

  const removeWorkExperience = (index: number) => {
    if (formData.workExperience.length > 1) {
      setFormData(prev => ({
        ...prev,
        workExperience: prev.workExperience.filter((_, i) => i !== index)
      }));
    }
  };

  const updateWorkExperience = (index: number, field: keyof WorkExperience, value: string) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { institution: '', degree: '', graduationDate: '' }]
    }));
  };

  const removeEducation = (index: number) => {
    if (formData.education.length > 1) {
      setFormData(prev => ({
        ...prev,
        education: prev.education.filter((_, i) => i !== index)
      }));
    }
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const addProject = () => {
    setFormData(prev => ({
      ...prev,
      projects: [...prev.projects, { title: '', description: '', technologies: '' }]
    }));
  };

  const removeProject = (index: number) => {
    if (formData.projects.length > 1) {
      setFormData(prev => ({
        ...prev,
        projects: prev.projects.filter((_, i) => i !== index)
      }));
    }
  };

  const updateProject = (index: number, field: keyof Project, value: string) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.map((project, i) => 
        i === index ? { ...project, [field]: value } : project
      )
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.jobDescription.trim()) {
      setError("Please provide a job description");
      return;
    }

    setError(null);
    setGeneratedResume(null);
    setScoreResult(null);

    await generateOperation.execute(formData);
  };

  const handleDownloadPdf = async (editableResume?: ResumeData) => {
    console.log('Create handleDownloadPdf called with selectedTemplate:', selectedTemplate);
    
    if (generatedResume && resumeResponse) {
      try {
        const safeResponse = {
          ...generatedResume,
          summary: generatedResume.summary || "",
          skills: generatedResume.skills || {},
          work_experience: generatedResume.work_experience || [],
          education: generatedResume.education || [],
          projects: generatedResume.projects || [],
          certifications: generatedResume.certifications || []
        };
        
        const mergedData = { 
          ...safeResponse,
          // Ensure contact information is always included
          contact_details: {
            name: formData.fullName,
            email: formData.email,
            phone: formData.phoneNumber,
            location: formData.location
          }
        };
        if (editableResume) {
          if (editableResume.summary) mergedData.summary = editableResume.summary;
          if (editableResume.skills) mergedData.skills = editableResume.skills;
          if (editableResume.work_experience) mergedData.work_experience = editableResume.work_experience;
          if (editableResume.education) mergedData.education = editableResume.education;
          if (editableResume.projects) mergedData.projects = editableResume.projects;
          if (editableResume.certifications) mergedData.certifications = editableResume.certifications;
          // Preserve contact details if they exist in editable resume, otherwise keep form data
          if (editableResume.contact_details) {
            mergedData.contact_details = {
              name: editableResume.contact_details.name || formData.fullName,
              email: editableResume.contact_details.email || formData.email,
              phone: editableResume.contact_details.phone || formData.phoneNumber,
              location: editableResume.contact_details.location || formData.location
            };
          }
        }
        
        await downloadPdf(mergedData, resumeResponse);
      } catch (error) {
        console.error("Error generating PDF:", error);
      }
    }
  };

  const handleReset = () => {
    setFormData({
      // Personal Information
      fullName: '',
      email: user?.email || '',
      phoneNumber: '',
      location: '',
      // Job and Content
      jobDescription: '',
      currentSummary: '',
      workExperience: [{ company: '', title: '', dateRange: '' }],
      education: [{ institution: '', degree: '', graduationDate: '' }],
      projects: [{ title: '', description: '', technologies: '' }],
      certifications: '',
      licenses: ''
    });
    setGeneratedResume(null);
    setResumeResponse(null);
    setScoreResult(null);
    setError(null);
    setIsScoring(false);
    generateOperation.reset();
  };

  const handleSaveResume = async (request: SaveResumeRequest) => {
    if (!generatedResume) {
      return { success: false, error: 'No resume to save' };
    }

    try {
      // Transform form data to match the expected format
      const transformedFormData = {
        // Personal Information
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        location: formData.location,
        // Job and Content
        jobDescription: formData.jobDescription,
        currentSummary: formData.currentSummary,
        workExperience: formData.workExperience,
        education: formData.education,
        projects: formData.projects,
        certifications: formData.certifications,
        licenses: formData.licenses
      };

      // Transform generated data to match the expected format
      const transformedGeneratedData = {
        summary: generatedResume.summary || '',
        skills: {
          technical_skills: generatedResume.skills?.technical_skills || [],
          soft_skills: generatedResume.skills?.soft_skills || [],
          ...generatedResume.skills
        },
        work_experience: (generatedResume.work_experience || []).map(exp => ({
          company: exp.company || '',
          title: exp.title || exp.role || '',
          role: exp.role || exp.title || '',
          dates: exp.dates || exp.date_range || '',
          date_range: exp.date_range || exp.dates || '',
          accomplishments: exp.accomplishments || exp.bullets || [],
          bullets: exp.bullets || exp.accomplishments || []
        })),
        education: (generatedResume.education || []).map(edu => {
          const eduData = edu as unknown as Record<string, unknown>;
          return {
            institution: (eduData.school as string) || (eduData.institution as string) || '',
            degree: edu.degree || '',
            graduationDate: (eduData.dates as string) || (eduData.graduation_date as string) || (eduData.graduationDate as string) || ''
          };
        }),
        projects: (generatedResume.projects || []).map(proj => ({
          title: proj.title || '',
          description: proj.description || '',
          technologies: Array.isArray(proj.technologies) ? proj.technologies.join(', ') : (proj.technologies || '')
        })),
        certifications: generatedResume.certifications || []
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

  // Helper function to create resume text from generated data
  const createResumeText = (resumeData: ResumeData): string => {
    let resumeText = '';
    
    // Contact Information
    resumeText += `${formData.fullName}\n`;
    resumeText += `${formData.email} | ${formData.phoneNumber}\n`;
    resumeText += `${formData.location}\n\n`;
    
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
    
    return resumeText;
  };

  const isLoading = generateOperation.isLoading;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 p-2 sm:p-4 md:p-6 pt-16 md:pt-6 overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto">
          {/* Header - Mobile Optimized */}
          <div className="text-center mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl text-black font-bold mb-1 sm:mb-2 flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-blue-600" />
              Create Resume from Scratch
            </h1>
            <p className="text-sm sm:text-base text-gray-600 px-2 sm:px-0">
              Provide your complete information and let AI generate professional summary, skills, and achievements
            </p>
          </div>

          {/* Form Section - Show when no generated resume */}
          {!generatedResume && !isLoading && (
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                
                {/* Personal Information Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Personal Information
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Enter your contact details that will appear at the top of your resume.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="fullName" className="text-xs sm:text-sm text-black">Full Name *</Label>
                        <Input
                          id="fullName"
                          placeholder="John Doe"
                          value={formData.fullName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('fullName', e.target.value)}
                          required
                          className="text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-xs sm:text-sm text-black">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john.doe@email.com"
                          value={formData.email}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                          required
                          className="text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phoneNumber" className="text-xs sm:text-sm text-black">Phone Number *</Label>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={formData.phoneNumber}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('phoneNumber', e.target.value)}
                          required
                          className="text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="location" className="text-xs sm:text-sm text-black">Location *</Label>
                        <Input
                          id="location"
                          placeholder="London, UK"
                          value={formData.location}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('location', e.target.value)}
                          required
                          className="text-xs sm:text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">City, Country (e.g., New York, USA)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Job Description Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                      Target Job Information
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Enter the job description and your current summary (optional).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div>
                      <Label htmlFor="jobDescription" className="text-xs sm:text-sm text-black">Job Description *</Label>
                      <Textarea
                        id="jobDescription"
                        placeholder="Paste the complete job description here..."
                        value={formData.jobDescription}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('jobDescription', e.target.value)}
                        required
                        rows={6}
                        className="resize-none text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currentSummary" className="text-xs sm:text-sm text-black">Current Summary (Optional)</Label>
                      <Textarea
                        id="currentSummary"
                        placeholder="Your current professional summary if you have one..."
                        value={formData.currentSummary}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('currentSummary', e.target.value)}
                        rows={4}
                        className="resize-none text-xs sm:text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Work Experience Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                      <Briefcase className="h-4 w-4 sm:h-5 sm:w-5" />
                      Work Experience
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Add your work experience. AI will generate achievements for each position.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    {formData.workExperience.map((exp, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                          <h4 className="font-medium text-xs sm:text-sm text-black">Experience {index + 1}</h4>
                          {formData.workExperience.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeWorkExperience(index)}
                              className="h-6 w-6 p-0 sm:h-8 sm:w-8"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
                          <div>
                            <Label htmlFor={`company-${index}`} className="text-xs sm:text-sm text-black">Company *</Label>
                            <Input
                              id={`company-${index}`}
                              placeholder="Company name"
                              value={exp.company}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateWorkExperience(index, 'company', e.target.value)}
                              required
                              className="text-xs sm:text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`title-${index}`} className="text-xs sm:text-sm text-black">Job Title *</Label>
                            <Input
                              id={`title-${index}`}
                              placeholder="Job title"
                              value={exp.title}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateWorkExperience(index, 'title', e.target.value)}
                              required
                              className="text-xs sm:text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`dates-${index}`} className="text-xs sm:text-sm text-black">Date Range *</Label>
                            <Input
                              id={`dates-${index}`}
                              placeholder="Jan 2020 - Present"
                              value={exp.dateRange}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateWorkExperience(index, 'dateRange', e.target.value)}
                              required
                              className="text-xs sm:text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addWorkExperience} className="w-full text-xs sm:text-sm">
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Add Work Experience
                    </Button>
                  </CardContent>
                </Card>

                {/* Education Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                      <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
                      Education
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-black">
                      Add your educational background (can be left empty).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    {formData.education.map((edu, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                          <h4 className="font-medium text-xs sm:text-sm text-black">Education {index + 1}</h4>
                          {formData.education.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeEducation(index)}
                              className="h-6 w-6 p-0 sm:h-8 sm:w-8"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
                          <div>
                            <Label htmlFor={`institution-${index}`} className="text-xs sm:text-sm text-black">Institution</Label>
                            <Input
                              id={`institution-${index}`}
                              placeholder="University/School name"
                              value={edu.institution}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEducation(index, 'institution', e.target.value)}
                              className="text-xs sm:text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`degree-${index}`} className="text-xs sm:text-sm text-black">Degree</Label>
                            <Input
                              id={`degree-${index}`}
                              placeholder="Degree title"
                              value={edu.degree}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEducation(index, 'degree', e.target.value)}
                              className="text-xs sm:text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`graduation-${index}`} className="text-xs sm:text-sm text-black">Graduation Date</Label>
                            <Input
                              id={`graduation-${index}`}
                              placeholder="2020, May 2022, etc."
                              value={edu.graduationDate}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEducation(index, 'graduationDate', e.target.value)}
                              className="text-xs sm:text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addEducation} className="w-full text-xs sm:text-sm">
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Add Education
                    </Button>
                  </CardContent>
                </Card>

                {/* Projects Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                      Projects
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Add your projects (can be left empty).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    {formData.projects.map((project, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                          <h4 className="font-medium text-xs sm:text-sm text-black">Project {index + 1}</h4>
                          {formData.projects.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeProject(index)}
                              className="h-6 w-6 p-0 sm:h-8 sm:w-8"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="space-y-3 sm:space-y-4">
                          <div>
                            <Label htmlFor={`project-title-${index}`} className="text-xs sm:text-sm text-black">Project Title</Label>
                            <Input
                              id={`project-title-${index}`}
                              placeholder="Project name"
                              value={project.title}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProject(index, 'title', e.target.value)}
                              className="text-xs sm:text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`project-description-${index}`} className="text-xs sm:text-sm text-black">Description</Label>
                            <Textarea
                              id={`project-description-${index}`}
                              placeholder="Brief description of the project"
                              value={project.description}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateProject(index, 'description', e.target.value)}
                              rows={3}
                              className="text-xs sm:text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`project-technologies-${index}`} className="text-xs sm:text-sm text-black">Technologies</Label>
                            <Input
                              id={`project-technologies-${index}`}
                              placeholder="React, Node.js, Python, etc."
                              value={project.technologies}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProject(index, 'technologies', e.target.value)}
                              className="text-xs sm:text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addProject} className="w-full text-xs sm:text-sm">
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Add Project
                    </Button>
                  </CardContent>
                </Card>

                {/* Certifications & Licenses Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                      <Award className="h-4 w-4 sm:h-5 sm:w-5" />
                      Certifications & Licenses
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Add your certifications and licenses (can be left empty).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div>
                      <Label htmlFor="certifications" className="text-xs sm:text-sm text-black">Certifications</Label>
                      <Textarea
                        id="certifications"
                        placeholder="List your certifications, one per line or separated by commas"
                        value={formData.certifications}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('certifications', e.target.value)}
                        rows={3}
                        className="text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="licenses" className="text-xs sm:text-sm text-black">Licenses</Label>
                      <Textarea
                        id="licenses"
                        placeholder="List your licenses, one per line or separated by commas"
                        value={formData.licenses}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('licenses', e.target.value)}
                        rows={3}
                        className="text-xs sm:text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 text-xs sm:text-sm"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 bg-white/30 rounded-sm animate-pulse"></div>
                        <span className="hidden sm:inline">Generating Resume...</span>
                        <span className="sm:hidden">Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Generate Resume</span>
                        <span className="sm:hidden">Generate</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Loading State - Centered */}
          {isLoading && !generatedResume && (
            <div className="flex items-center justify-center min-h-[60vh] px-4">
              <div className="text-center">
                {/* AI Generation Message */}
                <div className="mb-8">
                  <div className="p-4 bg-blue-50 rounded-full mb-6 w-fit mx-auto">
                    <Sparkles className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    AI is generating your professional resume...
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Please wait while we create a tailored resume based on your information and job requirements.
                  </p>
                </div>
                
                {/* Progress indicator */}
                <div className="flex items-center justify-center space-x-2 mb-8">
                  <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="h-3 w-3 bg-blue-300 rounded-full animate-pulse animation-delay-100"></div>
                  <div className="h-3 w-3 bg-blue-200 rounded-full animate-pulse animation-delay-200"></div>
                </div>
                
                {/* Compact Resume Preview Skeleton */}
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="space-y-2">
                      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mx-auto"></div>
                      <div className="h-3 w-32 bg-gray-200 rounded animate-pulse mx-auto"></div>
                    </div>
                    
                    {/* Content Lines */}
                    <div className="space-y-2 pt-4">
                      <div className="h-3 w-full bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-5/6 bg-gray-200 rounded animate-pulse mx-auto"></div>
                      <div className="h-3 w-4/5 bg-gray-200 rounded animate-pulse mx-auto"></div>
                    </div>
                    
                    {/* Sections */}
                    <div className="space-y-3 pt-4">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      <div className="space-y-1">
                        <div className="h-3 w-full bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Layout - Two Column like Dashboard */}
          {generatedResume && (
            <div className="flex flex-col lg:flex-row lg:gap-6 min-h-[calc(100vh-200px)]">
              {/* Left Column - Generated Resume */}
              <div className="w-full lg:w-[60%] mb-4 sm:mb-6 lg:mb-0">
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden h-full">
                  {/* Header - Mobile Optimized */}
                  <div className="p-3 sm:p-4 bg-white border-b">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 flex-shrink-0" />
                        <h2 className="text-sm sm:text-lg font-semibold text-black truncate">
                          Generated Resume
                        </h2>
                        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full whitespace-nowrap">
                          ✨ AI Generated
                        </span>
                      </div>
                      
                      {/* Action Buttons - Mobile Optimized */}
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        <button
                          onClick={handleReset}
                          className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors whitespace-nowrap"
                        >
                          <span className="hidden sm:inline">Create New</span>
                          <span className="sm:hidden">New</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Resume Content - Mobile Optimized */}
                  <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(100vh-300px)]">
                    <ErrorBoundary fallback={
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                        <p className="text-red-800 text-sm">Error displaying resume. Please try again.</p>
                      </div>
                    }>
                      <ResumeEditProvider initialData={generatedResume}>
                        <OptimizedResume
                          response={generatedResume}
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
                      {/* Header */}
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="h-5 w-5 bg-blue-200 rounded animate-pulse"></div>
                        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      
                      {/* Score Circle Skeleton */}
                      <div className="text-center mb-6">
                        <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full animate-pulse mb-3"></div>
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto"></div>
                      </div>
                      
                      {/* Score Breakdown */}
                      <div className="space-y-4">
                        <div className="h-5 w-36 bg-gray-200 rounded animate-pulse"></div>
                        
                        {/* Individual Score Items */}
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                            <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Suggestions Section */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="h-5 w-28 bg-gray-200 rounded animate-pulse mb-3"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                      
                      {/* Progress indicator */}
                      <div className="mt-6 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                          <div className="h-1.5 w-1.5 bg-blue-300 rounded-full animate-pulse animation-delay-100"></div>
                          <div className="h-1.5 w-1.5 bg-blue-200 rounded-full animate-pulse animation-delay-200"></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Analyzing resume match...</p>
                      </div>
                    </div>
                  ) : scoreResult ? (
                    <DashboardScoreResult
                      scoreResult={scoreResult}
                      onStartOverAction={handleReset}
                      showOptimizeButton={false}
                      isOptimizing={false}
                    />
                  ) : (
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
                      <div className="text-center text-gray-500 text-sm sm:text-base">
                        Score will appear here once generation is complete
                      </div>
                    </div>
                  )}
                </ErrorBoundary>
              </div>
            </div>
          )}

          {/* Empty State - Mobile Optimized */}
          {!generatedResume && !isLoading && (
            <div className="max-w-2xl mx-auto text-center py-8 sm:py-12 px-4 sm:px-0">
              <div className="p-3 sm:p-4 bg-blue-50 rounded-full mb-4 sm:mb-6 w-fit mx-auto">
                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Ready to Create Your Resume?</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Fill out the form above to generate a professional resume tailored to your target job.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-left">
                <div className="bg-white p-3 sm:p-4 rounded-lg border">
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="font-medium text-gray-900 text-sm sm:text-base">AI-Generated Content</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">Professional summary, skills, and achievements created by AI</p>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-lg border">
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="font-medium text-gray-900 text-sm sm:text-base">Instant Scoring</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">Get match percentage and optimization suggestions</p>
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
            description: "Your resume has been saved and can be accessed from your saved resumes.",
          });
        }}
        defaultTitle={`Resume for ${formData.jobDescription.split(' ').slice(0, 3).join(' ')}...`}
      />
    </div>
  );
} 