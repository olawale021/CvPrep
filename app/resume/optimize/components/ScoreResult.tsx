import { AlertCircle, ArrowRight, Check, ExternalLink, FileText, Loader, Sparkles, Star, X } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Button } from "../../../../components/ui/Button";
import { ResumeScore } from "../../../../lib/resume/scoreResume";

interface ScoreResultProps {
  scoreResult: ResumeScore;
  handleOptimize: () => void;
  loading: boolean;
  setScoreResult: React.Dispatch<React.SetStateAction<ResumeScore | null>>;
}

export default function ScoreResult({ 
  scoreResult, 
  handleOptimize, 
  loading,
  setScoreResult 
}: ScoreResultProps) {
  // Convert score to star rating (0-5 scale)
  const getStarRating = (score: number) => {
    return (score / 100) * 5;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 ease-in-out">
      <div className="p-4 bg-white border-b flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Resume Match Score</h2>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
            {/* Missing Skills */}
            {scoreResult.missing_skills && scoreResult.missing_skills.length > 0 && (
              <div className="bg-gray-50 border rounded-lg p-2 sm:p-3">
                <h4 className="font-semibold text-gray-700 mb-1 flex items-center text-xs sm:text-sm">
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-amber-500" />
                  Missing Skills ({scoreResult.missing_skills.length})
                </h4>
                <div className="max-h-16 sm:max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
                  <ul className="space-y-1 pl-2 text-xs">
                    {scoreResult.missing_skills.slice(0, 5).map((skill: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-600 mr-1.5 flex-shrink-0 p-0.5">
                          <X className="h-2 w-2" />
                        </span>
                        <span className="text-gray-700">{skill}</span>
                      </li>
                    ))}
                    {scoreResult.missing_skills.length > 5 && (
                      <li className="text-xs text-gray-500 italic pl-4">
                        +{scoreResult.missing_skills.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
            
            {/* Matched Skills */}
            {scoreResult.matched_skills && scoreResult.matched_skills.length > 0 && (
              <div className="bg-green-50 border rounded-lg p-2 sm:p-3">
                <h4 className="font-semibold text-gray-700 mb-1 flex items-center text-xs sm:text-sm">
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-green-500" />
                  Matched Skills ({scoreResult.matched_skills.length})
                </h4>
                <div className="max-h-16 sm:max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
                  <ul className="space-y-1 pl-2 text-xs">
                    {scoreResult.matched_skills.slice(0, 5).map((skill: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-flex items-center justify-center rounded-full bg-green-100 text-green-600 mr-1.5 flex-shrink-0 p-0.5">
                          <Check className="h-2 w-2" />
                        </span>
                        <span className="text-gray-700">{skill}</span>
                      </li>
                    ))}
                    {scoreResult.matched_skills.length > 5 && (
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
        
        {/* Action Buttons */}
        {scoreResult.match_score < 40 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 mb-1 text-sm">Resume needs improvement</h4>
                <p className="text-amber-700 text-xs mb-2">
                  Your resume score is below 40%, it may not align well with this job.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
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
              <Loader className="h-4 w-4 mr-2 animate-spin" />
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
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
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
  );
}
