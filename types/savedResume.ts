// Types for saved resume functionality

export interface SavedResumeFormData {
  jobDescription: string;
  currentSummary: string;
  workExperience: WorkExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  certifications: string;
  licenses: string;
}

export interface WorkExperienceItem {
  company: string;
  title: string;
  dateRange: string;
}

export interface EducationItem {
  institution: string;
  degree: string;
  graduationDate: string;
}

export interface ProjectItem {
  title: string;
  description: string;
  technologies: string;
}

export interface GeneratedResumeData {
  summary: string;
  skills: {
    technical_skills: string[];
    soft_skills: string[];
    [key: string]: string[];
  };
  work_experience: GeneratedWorkExperience[];
  education: EducationItem[];
  projects: ProjectItem[];
  certifications: string[];
}

export interface GeneratedWorkExperience {
  company: string;
  title: string;
  role: string;
  dates: string;
  date_range: string;
  accomplishments: string[];
  bullets: string[];
}

export interface SavedResume {
  id: string;
  user_id: string;
  title: string;
  
  // Original form data
  job_description?: string;
  current_summary?: string;
  work_experience?: SavedResumeFormData['workExperience'];
  education?: SavedResumeFormData['education'];
  projects?: SavedResumeFormData['projects'];
  certifications?: string;
  licenses?: string;
  
  // Generated resume data
  generated_summary?: string;
  generated_skills?: GeneratedResumeData['skills'];
  generated_work_experience?: GeneratedResumeData['work_experience'];
  generated_education?: GeneratedResumeData['education'];
  generated_projects?: GeneratedResumeData['projects'];
  generated_certifications?: string[];
  
  // Metadata
  is_primary: boolean;
  is_favorite: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface SaveResumeRequest {
  title: string;
  formData: SavedResumeFormData;
  generatedData: GeneratedResumeData;
  isPrimary?: boolean;
  isFavorite?: boolean;
}

export interface UpdateSavedResumeRequest {
  id: string;
  title?: string;
  generatedData?: Partial<GeneratedResumeData>;
  isPrimary?: boolean;
  isFavorite?: boolean;
}

export interface SavedResumeListItem {
  id: string;
  title: string;
  is_primary: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  job_description?: string;
}

// API Response types
export interface SavedResumeResponse {
  success: boolean;
  data?: SavedResume;
  error?: string;
}

export interface SavedResumeListResponse {
  success: boolean;
  data?: SavedResumeListItem[];
  error?: string;
} 