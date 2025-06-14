'use client';

import { Award, Briefcase, FileText, GraduationCap, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import React, { FormEvent, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { ErrorBoundary } from '../../../components/ui/ErrorBoundary';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import Sidebar from '../../../components/ui/Sidebar';
import { Textarea } from '../../../components/ui/Textarea';
import { useAuth } from '../../../context/AuthContext';
import { useAsyncOperation } from '../../../hooks/useAsyncOperation';
import { ResumeScore } from '../../../lib/resume/scoreResume';
import { supabase } from '../../../lib/supabaseClient';
import DashboardScoreResult from '../dashboard/components/DashboardScoreResult';
import ErrorMessage from '../optimize/components/ErrorMessage';
import LoadingState from '../optimize/components/LoadingState';
import OptimizedResume from '../optimize/components/OptimizedResume';
import { ResumeEditProvider } from '../optimize/context/ResumeEditContext';
import { usePdfGenerator } from '../optimize/hooks/usePdfGenerator';
import { ResumeData, ResumeResponse } from '../optimize/types';

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
  
  const [formData, setFormData] = useState<CreateResumeFormData>({
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

  const { isPdfGenerating, downloadPdf } = usePdfGenerator();

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
        setGeneratedResume(resume);
        // Create mock resume response for compatibility
        setResumeResponse({
          data: resume,
          original: resume,
          contact_details: {
            name: '',
            email: '',
            phone_number: '',
            location: ''
          }
        });
        // Score the generated resume
        scoreGeneratedResume(resume);
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
            <p className="text-gray-600 mb-6">Please sign in to create your resume.</p>
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

  // Generate resume operation
  const scoreGeneratedResume = async (resumeData: ResumeData) => {
    if (!formData.jobDescription.trim()) return;
    
    setIsScoring(true);
    setScoreResult(null);

    try {
      // Create text representation of generated resume
      const resumeText = createResumeText(resumeData);
      const resumeBlob = new Blob([resumeText], { type: 'text/plain' });
      const resumeFile = new File([resumeBlob], 'generated_resume.txt', { type: 'text/plain' });
      
      const scoreFormData = new FormData();
      scoreFormData.append('file', resumeFile);
      scoreFormData.append('job', formData.jobDescription.trim());

      const response = await fetch('/api/resume/score', {
        method: 'POST',
        body: scoreFormData
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
    setFormData({
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

  // Helper function to create resume text from generated data
  const createResumeText = (resumeData: ResumeData): string => {
    let resumeText = '';
    
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
                      <Label htmlFor="jobDescription" className="text-xs sm:text-sm">Job Description *</Label>
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
                      <Label htmlFor="currentSummary" className="text-xs sm:text-sm">Current Summary (Optional)</Label>
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
                          <h4 className="font-medium text-xs sm:text-sm">Experience {index + 1}</h4>
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
                            <Label htmlFor={`company-${index}`} className="text-xs sm:text-sm">Company *</Label>
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
                            <Label htmlFor={`title-${index}`} className="text-xs sm:text-sm">Job Title *</Label>
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
                            <Label htmlFor={`dates-${index}`} className="text-xs sm:text-sm">Date Range *</Label>
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
                    <CardDescription className="text-xs sm:text-sm">
                      Add your educational background (can be left empty).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    {formData.education.map((edu, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                          <h4 className="font-medium text-xs sm:text-sm">Education {index + 1}</h4>
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
                            <Label htmlFor={`institution-${index}`} className="text-xs sm:text-sm">Institution</Label>
                            <Input
                              id={`institution-${index}`}
                              placeholder="University/School name"
                              value={edu.institution}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEducation(index, 'institution', e.target.value)}
                              className="text-xs sm:text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`degree-${index}`} className="text-xs sm:text-sm">Degree</Label>
                            <Input
                              id={`degree-${index}`}
                              placeholder="Degree title"
                              value={edu.degree}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEducation(index, 'degree', e.target.value)}
                              className="text-xs sm:text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`graduation-${index}`} className="text-xs sm:text-sm">Graduation Date</Label>
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
                          <h4 className="font-medium text-xs sm:text-sm">Project {index + 1}</h4>
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
                            <Label htmlFor={`project-title-${index}`} className="text-xs sm:text-sm">Project Title</Label>
                            <Input
                              id={`project-title-${index}`}
                              placeholder="Project name"
                              value={project.title}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProject(index, 'title', e.target.value)}
                              className="text-xs sm:text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`project-description-${index}`} className="text-xs sm:text-sm">Description</Label>
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
                            <Label htmlFor={`project-technologies-${index}`} className="text-xs sm:text-sm">Technologies</Label>
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
                      <Label htmlFor="certifications" className="text-xs sm:text-sm">Certifications</Label>
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
                      <Label htmlFor="licenses" className="text-xs sm:text-sm">Licenses</Label>
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
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1 sm:mr-2" />
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

          {/* Loading State - Mobile Optimized */}
          {isLoading && !generatedResume && (
            <div className="max-w-4xl mx-auto">
              <LoadingState type="optimizing" />
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
    </div>
  );
} 