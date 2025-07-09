import { FormEvent, useRef, useState } from "react";
import { useToast } from "../../../../components/ui/feedback/use-toast";
import { supabase } from "../../../../lib/auth/supabaseClient";
import { showFeedbackNotification } from "../../../../lib/core/utils";
import { ResumeScore } from "../../../../lib/services/resume/resumeUtils/scoreResume";
import { ApiEducationItem, ApiProjectItem, ApiResumeResponse, ApiWorkExperienceItem, ResumeData, ResumeResponse } from "../types";

export function useResumeOptimizer() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [scoreResult, setScoreResult] = useState<ResumeScore | null>(null);
  const [response, setResponse] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scoringMode, setScoringMode] = useState(true);
  const [resumeResponse, setResumeResponse] = useState<ResumeResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleScoreSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file || !jobDescription) {
      setError("Please upload a resume and enter a job description.");
      return;
    }
    
    setError(null);
    setIsScoring(true);
    
    try {
      // Get the session token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const form = new FormData();
      form.append("file", file);
      form.append("job", jobDescription);
      
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Call both analyze and score APIs in parallel
      const [analyzeRes, scoreRes] = await Promise.all([
        fetch("/api/resume/analyze", { 
          method: "POST", 
          body: form,
          headers 
        }),
        fetch("/api/resume/score", { 
          method: "POST", 
          body: form,
          headers 
        })
      ]);
      
      const [analyzeData, scoreData] = await Promise.all([
        analyzeRes.json(),
        scoreRes.json()
      ]);
      
      // Check for errors
      if (!analyzeRes.ok) throw new Error(analyzeData.error || "Failed to analyze resume");
      if (!scoreRes.ok) throw new Error(scoreData.error || "Failed to score resume");
      
      // Set both response data (for resume analysis) and score result (for scoring)
      setResponse(analyzeData);
      setScoreResult(scoreData);
      
      // Create resume response object for compatibility
      const resumeResponseData: ResumeResponse = {
        data: analyzeData,
        original: analyzeData,
        contact_details: analyzeData.contact_details || {
          name: "",
          email: "",
          phone_number: "",
          location: ""
        }
      };
      setResumeResponse(resumeResponseData);
      
      setScoringMode(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to analyze and score resume");
    } finally {
      setIsScoring(false);
    }
  };

  const handleOptimize = async () => {
    if (!file || !jobDescription) {
      setError("Please upload a resume and enter a job description.");
      return;
    }
    
    setError(null);
    setLoading(true);
    setScoringMode(false);
    
    try {
      // Get the session token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const form = new FormData();
      form.append("file", file);
      form.append("job", jobDescription);
      
      // Include missing skills from the original analysis if available
      if (scoreResult?.missing_skills && scoreResult.missing_skills.length > 0) {
        form.append("missing_skills", JSON.stringify(scoreResult.missing_skills));
      }
      
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch("/api/resume/optimize", { 
        method: "POST", 
        body: form,
        headers 
      });
      
      const data = await res.json() as ApiResumeResponse;
      
      if (!res.ok) throw new Error(data.error || "Failed to optimize resume");
      
      // Log the response to help debug

      
      // Check for field names with both lowercase and capitalized versions

      
      // Extract structured data from optimization response with fallbacks for capitalized field names
      const structuredData: ResumeData = {
        summary: data.summary || data.Summary || "",
        skills: data.skills || (data["Technical Skills"] ? {
          technical_skills: data["Technical Skills"] 
        } : (data.Skills ? {
          technical_skills: data.Skills
        } : {})),
        work_experience: Array.isArray(data.work_experience) ? data.work_experience.map((exp: ApiWorkExperienceItem) => ({
                           company: exp.company,
                           title: exp.role || exp.title || "",
                           dates: exp.date_range || exp.dates || "",
                           bullets: exp.accomplishments || exp.bullets || [],
                           accomplishments: exp.accomplishments || exp.bullets || [],
                           location: exp.location || ""
                         })) : 
                         Array.isArray(data["Work Experience"]) ? data["Work Experience"].map((exp: ApiWorkExperienceItem) => ({
                           company: exp.company,
                           title: exp.role || exp.title || "",
                           dates: exp.date_range || exp.dates || "",
                           bullets: exp.accomplishments || exp.bullets || [],
                           accomplishments: exp.accomplishments || exp.bullets || [],
                           location: exp.location || ""
                         })) : [],
        education: (() => {
          // Verify if we have education data in either format
          const rawEducation = Array.isArray(data.education) ? data.education : 
                              Array.isArray(data.Education) ? data.Education : [];
          
          // Map and ensure all required fields have fallback values
          return rawEducation.map((edu: ApiEducationItem) => ({
            school: edu.institution || edu.school || "",
            degree: edu.degree || "Degree",
            dates: edu.graduation_date || edu.dates || "",
            location: edu.location || ""
          }));
        })(),
        certifications: Array.isArray(data.certifications) ? data.certifications : 
                       Array.isArray(data.Certifications) ? data.Certifications : [],
        projects: Array.isArray(data.projects) ? data.projects :
                Array.isArray(data.Projects) ? data.Projects.map((proj: ApiProjectItem | string) => {
                  if (typeof proj === 'string') {
                    return {
                      title: "",
                      description: proj,
                      technologies: []
                    };
                  }
                  return {
                    title: proj.title || "",
                    description: proj.description,
                    technologies: proj.technologies || []
                  };
                }) : [],
        contact_details: data.contact_details || {
          name: "",
          email: "",
          phone: "",
          location: ""
        }
      };
      
      // Ensure we have at least basic data for each section
      if (!structuredData.summary) {
        console.warn("No summary found in API response, using fallback");
        structuredData.summary = "Professional summary not available.";
      }
      
      // Ensure skills object is properly structured
      if (!structuredData.skills || Object.keys(structuredData.skills).length === 0) {
        console.warn("No skills found in API response, using fallback");
        structuredData.skills = {
          technical_skills: [],
          soft_skills: []
        };
      }
      
      // Create response object
      const resumeResponseData: ResumeResponse = {
        data: structuredData,
        original: data,
        contact_details: data.contact_details || {
          name: "",
          email: "",
          phone_number: "",
          location: ""
        }
      };
      
      
      
      setResponse(structuredData);
      setResumeResponse(resumeResponseData);
      
      // Score optimized resume
      await scoreOptimizedResume(structuredData, jobDescription);
      
      // Show feedback notification after successful optimization
      showFeedbackNotification(toast, "optimized your resume");

    } catch (e: unknown) {
      console.error("Optimization error:", e);
      setError(e instanceof Error ? e.message : "Failed to optimize resume");
      setScoringMode(true);
    } finally {
      setLoading(false);
    }
  };

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
        setScoreResult(data);
        setScoringMode(true);
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
    
    if (resumeData.skills) {
      resumeText += 'SKILLS\n';
      
      // Add technical skills
      if (resumeData.skills.technical_skills && resumeData.skills.technical_skills.length > 0) {
        resumeText += 'Technical Skills:\n';
        resumeData.skills.technical_skills.forEach((skill: string) => {
          resumeText += `• ${skill}\n`;
        });
      }
      
      // Add soft skills
      if (resumeData.skills.soft_skills && resumeData.skills.soft_skills.length > 0) {
        resumeText += 'Soft Skills:\n';
        resumeData.skills.soft_skills.forEach((skill: string) => {
          resumeText += `• ${skill}\n`;
        });
      }
      
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

  return {
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
  };
} 