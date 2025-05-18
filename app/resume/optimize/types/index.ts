// Type Definitions for Resume Data
export interface WorkExperience {
    company: string;
    title: string;
    role?: string;
    dates: string;
    date_range?: string;
    bullets: string[];
    accomplishments?: string[];
    location?: string;
  }
  
  export interface Education {
    school: string;
    degree: string;
    dates: string;
    location?: string;
  }
  
  export interface Project {
    title: string;
    description: string;
    technologies: string[];
  }
  
  export interface ResumeData {
    summary?: string;
    skills?: {
      technical_skills?: string[];
      soft_skills?: string[];
      [key: string]: string[] | undefined;
    };
    work_experience?: WorkExperience[];
    education?: Education[];
    certifications?: string[];
    projects?: Project[];
    contact_details?: {
      name?: string;
      email?: string;
      phone?: string;
      location?: string;
      linkedin?: string;
    };
  }
  
  // Score response interface
  export interface ScoreResponse {
    match_score: number;
    missing_skills: string[];
    recommendations: string[];
    matched_skills?: string[];
    extracted_text?: unknown;
  }
  
  // Update the state interface to include contact details
  export interface ResumeResponse {
    data: ResumeData;
    original: unknown;
    contact_details: {
      name?: string;
      email?: string;
      phone_number?: string;
      location?: string;
      linkedin?: string;
      github?: string;
    };
  }
  
  // API Response Work Experience item interface
  export interface ApiWorkExperienceItem {
    company: string;
    role?: string;
    title?: string;
    date_range?: string;
    dates?: string;
    accomplishments?: string[];
    bullets?: string[];
    location?: string;
  }
  
  // API Response Education item interface
  export interface ApiEducationItem {
    institution?: string;
    school?: string;
    degree: string;
    graduation_date?: string;
    dates?: string;
    location?: string;
  }
  
  // API Response Project item interface
  export interface ApiProjectItem {
    title?: string;
    description: string;
    technologies?: string[];
  }
  
  // API Response interface for handling capitalized keys
  export interface ApiResumeResponse {
    summary?: string;
    Summary?: string;
    skills?: ResumeData['skills'];
    Skills?: string[];
    "Technical Skills"?: string[];
    work_experience?: WorkExperience[];
    "Work Experience"?: ApiWorkExperienceItem[];
    education?: Education[];
    Education?: ApiEducationItem[];
    certifications?: string[];
    Certifications?: string[];
    projects?: Project[];
    Projects?: ApiProjectItem[] | string[];
    contact_details?: {
      name?: string;
      email?: string;
      phone?: string;
      phone_number?: string;
      location?: string;
      linkedin?: string;
    };
    optimized_text?: string;
    error?: string;
  } 