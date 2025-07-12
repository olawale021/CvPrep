import { AlertCircle, ArrowRight, Check, ExternalLink, FileText, Plus, Sparkles, Star, X } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Button } from "../../../../components/ui/base/Button";
import { supabase } from "../../../../lib/auth/supabaseClient";
import { ResumeScore } from "../../../../lib/services/resume/resumeUtils/scoreResume";
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
  showOptimizeButton?: boolean;
}

export default function ScoreResult({ 
  scoreResult, 
  handleOptimize, 
  loading,
  setScoreResult,
  file,
  jobDescription,
  onWorkExperienceAdded,
  showOptimizeButton = true
}: ScoreResultProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showAddExperienceForm, setShowAddExperienceForm] = useState(false);
  const [addingExperience, setAddingExperience] = useState(false);
  const [updatedResumeData, setUpdatedResumeData] = useState<UpdatedResumeData | null>(null);

  // Debug: Log the scoreResult to see what data we're receiving
  console.log('ScoreResult data:', {
    matched_skills: scoreResult.matched_skills,
    missing_skills: scoreResult.missing_skills,
    match_score: scoreResult.match_score,
    fullData: scoreResult
  });

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
      // Check usage limits before proceeding
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Quick usage check
      const usageResponse = await fetch('/api/user/usage', { headers });
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        if (usageData.isTrialExpired || (usageData.resume_scoring && usageData.resume_scoring.used >= usageData.resume_scoring.limit)) {
          // Don't proceed if limits are exceeded - the backend will handle this
    
        }
      }
      
      // Create a new FormData with the updated resume data
      const formData = new FormData();
      
      // Create a text representation of the updated resume
      const updatedResumeText = createResumeText(updatedResumeData);
      const updatedResumeBlob = new Blob([updatedResumeText], { type: 'text/plain' });
      const updatedResumeFile = new File([updatedResumeBlob], file.name, { type: file.type });
      
      formData.append('file', updatedResumeFile);
      formData.append('job', jobDescription);
      
      const response = await fetch('/api/resume/score', {
        method: 'POST',
        body: formData,
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
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
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out">
      <div className="bg-slate-800 border-b border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-white">
            <div className="p-2 bg-slate-700 rounded-lg mr-3">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Resume Analysis</h2>
              <p className="text-slate-300 text-sm">Professional evaluation results</p>
            </div>
          </div>
          
          {loading && (
            <div className="flex items-center text-white text-sm bg-slate-700 px-3 py-1 rounded-full">
              <Sparkles className="h-4 w-4 mr-1.5 animate-pulse" />
              <span>Optimizing...</span>
            </div>
          )}
        </div>
      </div>
      
      <div className={`p-6 md:p-8 ${loading ? 'bg-gray-50' : ''}`}>
        {/* Enhanced Score Display */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gray-200 rounded-full blur-xl opacity-20"></div>
            
            <div className="relative w-40 h-40 md:w-48 md:h-48">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {/* Background circle */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                
                {/* Score arc with gradient */}
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={scoreResult.match_score >= 70 ? "#10b981" : scoreResult.match_score >= 40 ? "#f59e0b" : "#ef4444"} />
                    <stop offset="100%" stopColor={scoreResult.match_score >= 70 ? "#059669" : scoreResult.match_score >= 40 ? "#d97706" : "#dc2626"} />
                  </linearGradient>
                </defs>
                
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="url(#scoreGradient)"
                  strokeWidth="12"
                  strokeDasharray={`${(scoreResult.match_score / 100) * 502} 502`}
                  strokeDashoffset={-126}
                  strokeLinecap="round"
                  transform="rotate(-90 100 100)"
                  className="transition-all duration-1000 ease-out"
                />
                
                {/* Score text */}
                <text
                  x="100"
                  y="85"
                  textAnchor="middle"
                  fontSize="42"
                  fontWeight="800"
                  fill={scoreResult.match_score >= 70 ? "#10b981" : scoreResult.match_score >= 40 ? "#f59e0b" : "#ef4444"}
                  className="font-mono"
                >
                  {Math.round(scoreResult.match_score)}
                </text>
                <text
                  x="100"
                  y="105"
                  textAnchor="middle"
                  fontSize="14"
                  fill="#6b7280"
                  fontWeight="600"
                >
                  MATCH SCORE
                </text>
                <text
                  x="100"
                  y="125"
                  textAnchor="middle"
                  fontSize="12"
                  fill="#9ca3af"
                >
                  out of 100
                </text>
              </svg>
            </div>
          </div>
          
          {/* Rating and Badge */}
          <div className="flex flex-col items-center space-y-3">
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star: number) => {
                const rating = getStarRating(scoreResult.match_score);
                const fullStar = star <= Math.floor(rating);
                const halfStar = !fullStar && star === Math.ceil(rating) && rating % 1 >= 0.3;
                
                return (
                  <div key={star} className="w-5 h-5 md:w-6 md:h-6">
                    {fullStar ? (
                      <Star className="w-full h-full fill-yellow-400 text-yellow-400 drop-shadow-sm" />
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
              <span className="ml-2 text-sm font-medium text-gray-600">
                {getStarRating(scoreResult.match_score).toFixed(1)} / 5.0
              </span>
            </div>
            
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
              scoreResult.match_score >= 80 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : scoreResult.match_score >= 60 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : scoreResult.match_score >= 40 
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {scoreResult.match_score >= 80 ? 'Excellent Match' : 
               scoreResult.match_score >= 60 ? 'Good Match' : 
               scoreResult.match_score >= 40 ? 'Fair Match' : 'Needs Improvement'}
            </div>
          </div>
        </div>
        
        {/* Enhanced Skills Analysis */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <div className="p-1 bg-blue-100 rounded-lg mr-2">
              <Check className="h-4 w-4 text-blue-600" />
            </div>
            Skills Analysis
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Matched Skills */}
            {scoreResult.matched_skills && scoreResult.matched_skills.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-green-800 flex items-center text-sm">
                    <div className="p-1 bg-green-200 rounded-full mr-2">
                      <Check className="h-3 w-3 text-green-700" />
                    </div>
                    Matched Skills
                  </h4>
                  <span className="bg-green-200 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                    {scoreResult.matched_skills.length}
                  </span>
                </div>
                
                <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-green-300">
                  <div className="flex flex-wrap gap-1.5">
                    {scoreResult.matched_skills.slice(0, isMobile ? 10 : 15).map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                      >
                        <Check className="h-2.5 w-2.5 mr-1" />
                        {skill}
                      </span>
                    ))}
                    {scoreResult.matched_skills.length > (isMobile ? 10 : 15) && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-200 text-green-700">
                        +{scoreResult.matched_skills.length - (isMobile ? 10 : 15)} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Missing Skills */}
            {scoreResult.missing_skills && scoreResult.missing_skills.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-red-800 flex items-center text-sm">
                    <div className="p-1 bg-red-200 rounded-full mr-2">
                      <AlertCircle className="h-3 w-3 text-red-700" />
                    </div>
                    Missing Skills
                  </h4>
                  <span className="bg-red-200 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    {scoreResult.missing_skills.length}
                  </span>
                </div>
                
                <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-red-300">
                  <div className="flex flex-wrap gap-1.5">
                    {scoreResult.missing_skills.slice(0, isMobile ? 10 : 15).map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200"
                      >
                        <X className="h-2.5 w-2.5 mr-1" />
                        {skill}
                      </span>
                    ))}
                    {scoreResult.missing_skills.length > (isMobile ? 10 : 15) && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-200 text-red-700">
                        +{scoreResult.missing_skills.length - (isMobile ? 10 : 15)} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Skills Summary */}
          {(scoreResult.matched_skills?.length > 0 || scoreResult.missing_skills?.length > 0) && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {scoreResult.matched_skills?.length || 0}
                    </div>
                    <div className="text-xs text-gray-600">Matched</div>
                  </div>
                  <div className="w-px h-8 bg-gray-300"></div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">
                      {scoreResult.missing_skills?.length || 0}
                    </div>
                    <div className="text-xs text-gray-600">Missing</div>
                  </div>
                  <div className="w-px h-8 bg-gray-300"></div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {Math.round(((scoreResult.matched_skills?.length || 0) / ((scoreResult.matched_skills?.length || 0) + (scoreResult.missing_skills?.length || 0))) * 100) || 0}%
                    </div>
                    <div className="text-xs text-gray-600">Coverage</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700">Skills Match Rate</div>
                  <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.round(((scoreResult.matched_skills?.length || 0) / ((scoreResult.matched_skills?.length || 0) + (scoreResult.missing_skills?.length || 0))) * 100) || 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
        ) : showOptimizeButton ? (
          <div className="mt-4">
            <Button 
              onClick={handleOptimize} 
              disabled={loading}
              className={`w-full ${loading ? 'bg-slate-600' : 'bg-slate-800 hover:bg-slate-700'} text-white font-medium flex items-center justify-center transition-colors`}
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
        ) : null}
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
