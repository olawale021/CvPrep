import { AlertCircle, ArrowRight, Check, ExternalLink, FileText, Plus, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Button } from "../../../../components/ui/base/Button";
import { supabase } from "../../../../lib/auth/supabaseClient";
import { ResumeScore } from "../../../../lib/services/resume/scoreResume";
import AddWorkExperienceForm from "./AddWorkExperienceForm";

interface UpdatedResumeData {
  success: boolean;
  message: string;
  updatedResume: unknown;
  addedExperience: {
    company: string;
    role: string;
    accomplishments: string[];
  };
  summary: string;
  skills: {
    technical_skills?: string[];
    [key: string]: string[] | undefined;
  };
  work_experience: WorkExperienceItem[];
  education: EducationItem[];
  certifications: string[];
  projects: unknown[];
  contact_details: {
    name: string;
    email: string;
    phone_number: string;
    location: string;
  };
}

interface WorkExperienceItem {
  company: string;
  title?: string;
  role?: string;
  dates?: string;
  date_range?: string;
  accomplishments?: string[];
  bullets?: string[];
}

interface EducationItem {
  degree: string;
  school?: string;
  institution?: string;
  dates?: string;
  graduation_date?: string;
}

interface ScoreResultProps {
  scoreResult: ResumeScore;
  handleOptimize: () => void;
  loading: boolean;
  setScoreResult: React.Dispatch<React.SetStateAction<ResumeScore | null>>;
  file: File | null;
  jobDescription: string;
  onWorkExperienceAdded?: (updatedResumeData: UpdatedResumeData) => void;
}

export default function ScoreResult({ 
  scoreResult, 
  handleOptimize, 
  loading,
  setScoreResult,
  file,
  jobDescription,
  onWorkExperienceAdded
}: ScoreResultProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showAddExperienceForm, setShowAddExperienceForm] = useState(false);
  const [addingExperience, setAddingExperience] = useState(false);
  const [updatedResumeData, setUpdatedResumeData] = useState<UpdatedResumeData | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // Check initially
    checkMobile();
    
    // Add event listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Convert score to star rating (0-5 scale)
  const getStarRating = (score: number) => {
    return (score / 100) * 5;
  };

  const handleAddWorkExperience = async (data: { jobTitle: string; company: string; achievements: string }): Promise<{ company: string; role: string; accomplishments: string[] }> => {
    if (!file) throw new Error('No file available');
    
    setAddingExperience(true);
    
    try {
      // Get the session token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('jobTitle', data.jobTitle);
      formData.append('company', data.company);
      formData.append('achievements', data.achievements);

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/resume/add-experience', {
        method: 'POST',
        body: formData,
        headers
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add work experience');
      }

      // Store the updated resume data for scoring
      setUpdatedResumeData(result as UpdatedResumeData);

      // Notify parent component about the updated resume
      if (onWorkExperienceAdded) {
        onWorkExperienceAdded(result as UpdatedResumeData);
      }

      // Return the added experience for the form to display
      return result.addedExperience;
      
    } catch (error) {
      console.error('Error adding work experience:', error);
      // Close the form on error
      setShowAddExperienceForm(false);
      throw error; // Re-throw so the form can handle the error
    } finally {
      setAddingExperience(false);
    }
  };

  const handleProceedToScore = async () => {
    if (!updatedResumeData || !file) return;
    
    try {
      // Get the session token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      // Create a new FormData with the updated resume data
      const formData = new FormData();
      
      // Create a text representation of the updated resume
      const updatedResumeText = createResumeText(updatedResumeData);
      const updatedResumeBlob = new Blob([updatedResumeText], { type: 'text/plain' });
      const updatedResumeFile = new File([updatedResumeBlob], file.name, { type: file.type });
      
      formData.append('file', updatedResumeFile);
      formData.append('job', jobDescription);
      
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/resume/score', {
        method: 'POST',
        body: formData,
        headers
      });
      
      const scoreData = await response.json();
      
      if (!response.ok) {
        throw new Error(scoreData.error || 'Failed to score updated resume');
      }
      
      // Update the score result with the new score
      setScoreResult(scoreData);
      
    } catch (error) {
      console.error('Error scoring updated resume:', error);
    }
  };

  const createResumeText = (resumeData: UpdatedResumeData): string => {
    // Create a text representation of the resume with the new work experience
    let resumeText = '';
    
    if (resumeData.summary) {
      resumeText += `SUMMARY\n${resumeData.summary}\n\n`;
    }
    
    if (resumeData.work_experience && resumeData.work_experience.length > 0) {
      resumeText += 'WORK EXPERIENCE\n';
      resumeData.work_experience.forEach((exp: WorkExperienceItem) => {
        resumeText += `${exp.title || exp.role} at ${exp.company}\n`;
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
    
    if (resumeData.skills && resumeData.skills.technical_skills) {
      resumeText += 'SKILLS\n';
      resumeData.skills.technical_skills.forEach((skill: string) => {
        resumeText += `• ${skill}\n`;
      });
      resumeText += '\n';
    }
    
    if (resumeData.education && resumeData.education.length > 0) {
      resumeText += 'EDUCATION\n';
      resumeData.education.forEach((edu: EducationItem) => {
        resumeText += `${edu.degree} - ${edu.school || edu.institution}\n`;
        if (edu.dates || edu.graduation_date) {
          resumeText += `${edu.dates || edu.graduation_date}\n`;
        }
        resumeText += '\n';
      });
    }
    
    return resumeText;
  };

  const handleFormClose = () => {
    setShowAddExperienceForm(false);
  };

  return (
    <>
    <div className="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 ease-in-out">
      <div className="p-4 bg-white border-b flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-black">Resume Match Score</h2>
        </div>
        
        {loading && (
          <div className="flex items-center text-blue-600 text-sm">
            <Sparkles className="h-4 w-4 mr-1.5 animate-pulse" />
            <span>Optimizing...</span>
          </div>
        )}
      </div>
      
      <div className={`p-4 sm:p-5 ${loading ? 'bg-blue-50/30' : ''}`}>
        {/* Modern Circular Score Gauge */}
        <div className="flex flex-col items-center justify-center mb-4">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40">
            {/* SVG Gauge */}
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="16"
              />
              
              {/* Score arc */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke={scoreResult.match_score >= 40 ? "#10b981" : "#f43f5e"}
                strokeWidth="16"
                strokeDasharray={`${(scoreResult.match_score / 100) * 502} 502`}
                strokeDashoffset={-126}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
              />
              
              {/* Score text */}
              <text
                x="100"
                y="90"
                textAnchor="middle"
                fontSize="48"
                fontWeight="700"
                fill={scoreResult.match_score >= 40 ? "#10b981" : "#f43f5e"}
              >
                {Math.round(scoreResult.match_score)}
              </text>
              <text
                x="100"
                y="120"
                textAnchor="middle"
                fontSize="18"
                fill="#6b7280"
              >
                out of 100
              </text>
            </svg>
          </div>
          
          <div className="flex items-center justify-center mt-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star: number) => {
                const rating = getStarRating(scoreResult.match_score);
                const fullStar = star <= Math.floor(rating);
                const halfStar = !fullStar && star === Math.ceil(rating) && rating % 1 >= 0.3;
                
                return (
                  <div key={star} className="w-4 h-4 sm:w-5 sm:h-5 mx-0.5">
                    {fullStar ? (
                      <Star className="w-full h-full fill-yellow-400 text-yellow-400" />
                    ) : halfStar ? (
                      <div className="relative">
                        <Star className="absolute w-full h-full text-gray-300" />
                        <div className="absolute overflow-hidden w-1/2 h-full">
                          <Star className="w-full h-full fill-yellow-400 text-yellow-400" />
                        </div>
                      </div>
                    ) : (
                      <Star className="w-full h-full text-gray-300" />
                    )}
                  </div>
                );
              })}
            </div>
            <span className="ml-2 text-xs sm:text-sm text-gray-500">
              {getStarRating(scoreResult.match_score).toFixed(1)} Rating
            </span>
          </div>
        </div>
        
        {/* Skills Analysis - Tabs for desktop, accordion for mobile */}
        <div className="mb-4">
          <h3 className="font-medium text-gray-800 mb-2">Skills Analysis</h3>
          
          <div className="grid grid-cols-1 gap-2 sm:gap-3">
            {/* Matched Skills */}
            {scoreResult.matched_skills && scoreResult.matched_skills.length > 0 && (
              <div className="bg-green-50 border rounded-lg p-2 sm:p-3">
                <h4 className="font-semibold text-gray-700 mb-1 flex items-center text-xs sm:text-sm">
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-green-500" />
                  Matched Skills ({scoreResult.matched_skills.length})
                </h4>
                <div className="sm:max-h-24 sm:overflow-y-auto sm:scrollbar-thin sm:scrollbar-thumb-gray-300">
                  <ul className="space-y-1 pl-2 text-xs">
                    {(isMobile ? scoreResult.matched_skills : scoreResult.matched_skills.slice(0, 5)).map((skill: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-flex items-center justify-center rounded-full bg-green-100 text-green-600 mr-1.5 flex-shrink-0 p-0.5">
                          <Check className="h-2 w-2" />
                        </span>
                        <span className="text-gray-700">{skill}</span>
                      </li>
                    ))}
                    {!isMobile && scoreResult.matched_skills.length > 5 && (
                      <li className="text-xs text-gray-500 italic pl-4">
                        +{scoreResult.matched_skills.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        {scoreResult.recommendations && scoreResult.recommendations.length > 0 && (
          <div className="bg-blue-50 border rounded-lg p-2 sm:p-3 mt-2">
            <h4 className="font-semibold text-gray-700 mb-1 flex items-center text-xs sm:text-sm">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-blue-500" />
              Recommendations
            </h4>
            <div className="sm:max-h-24 sm:overflow-y-auto sm:scrollbar-thin sm:scrollbar-thumb-gray-300">
              <ul className="space-y-1 pl-2 text-xs">
                {scoreResult.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="flex items-start">
                    <span className="inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mr-1.5 flex-shrink-0 p-0.5">
                      <Sparkles className="h-2 w-2" />
                    </span>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {scoreResult.match_score < 40 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                  <h4 className="font-medium text-amber-800 mb-1 text-sm">Low Work Experience Detected</h4>
                  <p className="text-amber-700 text-xs mb-3">
                    Your resume score is below 40%, indicating insufficient work experience for this role. 
                    Add relevant work experience to improve your match score.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => setShowAddExperienceForm(true)}
                      className="inline-flex items-center justify-center bg-blue-600 text-white font-medium py-1.5 px-3 rounded hover:bg-blue-700 transition-colors text-xs"
                    >
                      <Plus className="mr-1.5 h-3 w-3" />
                      Add Work Experience
                    </Button>
                  <Link href="/resume/create" className="inline-flex items-center justify-center bg-black text-white font-medium py-1.5 px-3 rounded hover:bg-gray-800 transition-colors text-xs">
                    Create new resume
                    <ExternalLink className="ml-1.5 h-3 w-3" />
                  </Link>
                  <Button 
                    onClick={() => setScoreResult(null)}
                    variant="outline" 
                    size="sm"
                    className="text-xs py-1.5 h-auto"
                  >
                    Try another
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="mt-4">
            <div className="w-full bg-blue-100 text-blue-800 py-2 px-3 rounded-md text-sm flex items-center justify-center">
              <div className="h-4 w-4 mr-2 bg-blue-800 rounded animate-pulse" />
              Your resume is being optimized
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <Button 
              onClick={handleOptimize} 
              disabled={loading}
              className={`w-full bg-gradient-to-r ${loading ? 'from-blue-600 to-blue-600' : 'from-black to-gray-800'} text-white hover:from-gray-800 hover:to-black font-medium flex items-center justify-center`}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 mr-2 bg-white/30 rounded animate-pulse" />
                  Optimizing Resume
                </>
              ) : (
                <>
                  Optimize Resume
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>

      {/* Add Work Experience Form Modal */}
      {showAddExperienceForm && (
        <AddWorkExperienceForm
          onSubmitAction={handleAddWorkExperience}
          onCancelAction={handleFormClose}
          onProceedToScoreAction={handleProceedToScore}
          loading={addingExperience}
        />
      )}
    </>
  );
}
