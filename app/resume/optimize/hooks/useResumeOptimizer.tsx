import { FormEvent, useRef, useState } from "react";
import { ResumeScore } from "../../../../lib/resume/scoreResume";
import { ApiEducationItem, ApiProjectItem, ApiResumeResponse, ApiWorkExperienceItem, ResumeData, ResumeResponse } from "../types";

export function useResumeOptimizer() {
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
      const form = new FormData();
      form.append("file", file);
      form.append("job", jobDescription);
      const res = await fetch("/api/resume/score", { method: "POST", body: form });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to score resume");
      setScoreResult(data);
      setScoringMode(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to score resume");
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
  
      
      const form = new FormData();
      form.append("file", file);
      form.append("job", jobDescription);
      

              const res = await fetch("/api/resume/optimize", { method: "POST", body: form });

      
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
        work_experience: Array.isArray(data.work_experience) ? data.work_experience.map((exp: any) => ({
                           company: exp.company,
                           title: exp.role || exp.title || "",
                           dates: exp.date_range || exp.dates || "",
                           bullets: exp.achievements || exp.accomplishments || exp.bullets || [],
                           accomplishments: exp.achievements || exp.accomplishments || exp.bullets || [],
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
      

    } catch (e: unknown) {
      console.error("Optimization error:", e);
      setError(e instanceof Error ? e.message : "Failed to optimize resume");
      setScoringMode(true);
    } finally {
      setLoading(false);
    }
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