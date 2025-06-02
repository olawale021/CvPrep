"use client";

import { ArrowRight, Check, FileText, RefreshCw, Sparkles, Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../../../components/ui/Button";
import { ResumeScore } from "../../../../lib/resume/scoreResume";

interface DashboardScoreResultProps {
  scoreResult: ResumeScore;
  onStartOverAction: () => void;
  showOptimizeButton?: boolean;
  onOptimize?: () => Promise<void>;
  isOptimizing?: boolean;
}

export default function DashboardScoreResult({ 
  scoreResult, 
  onStartOverAction, 
  showOptimizeButton = false,
  onOptimize,
  isOptimizing = false
}: DashboardScoreResultProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Convert score to star rating (0-5 scale)
  const getStarRating = (score: number) => {
    return (score / 100) * 5;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-50 border-green-200";
    if (score >= 60) return "bg-blue-50 border-blue-200";
    if (score >= 40) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  const getScoreMessage = (score: number) => {
    if (score >= 80) return "Excellent Match!";
    if (score >= 60) return "Good Match";
    if (score >= 40) return "Fair Match";
    return "Needs Improvement";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden h-full">
      <div className="p-4 bg-white border-b flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-black">Resume Analysis</h2>
        </div>
        <button
          onClick={onStartOverAction}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          New Analysis
        </button>
      </div>
      
      <div className="p-6 overflow-y-auto max-h-[calc(100vh-300px)]">
        {/* Score Display */}
        <div className={`rounded-xl border p-6 mb-6 ${getScoreBgColor(scoreResult.match_score)}`}>
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="16"
                />
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
                <text
                  x="100"
                  y="90"
                  textAnchor="middle"
                  fontSize="36"
                  fontWeight="700"
                  fill={scoreResult.match_score >= 40 ? "#10b981" : "#f43f5e"}
                >
                  {Math.round(scoreResult.match_score)}
                </text>
                <text
                  x="100"
                  y="115"
                  textAnchor="middle"
                  fontSize="14"
                  fill="#6b7280"
                >
                  /100
                </text>
              </svg>
            </div>
            
            <h3 className={`text-xl font-bold mb-2 ${getScoreColor(scoreResult.match_score)}`}>
              {getScoreMessage(scoreResult.match_score)}
            </h3>
            
            <div className="flex items-center justify-center mb-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star: number) => {
                  const rating = getStarRating(scoreResult.match_score);
                  const fullStar = star <= Math.floor(rating);
                  const halfStar = !fullStar && star === Math.ceil(rating) && rating % 1 >= 0.3;
                  
                  return (
                    <div key={star} className="w-4 h-4 mx-0.5">
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
              <span className="ml-2 text-sm text-gray-500">
                {getStarRating(scoreResult.match_score).toFixed(1)} Rating
              </span>
            </div>
          </div>
        </div>

        {/* Skills Analysis */}
        <div className="space-y-4">
          {/* Missing Skills */}
          {scoreResult.missing_skills && scoreResult.missing_skills.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-3 flex items-center text-sm">
                <X className="h-4 w-4 mr-2 text-red-500" />
                Missing Skills ({scoreResult.missing_skills.length})
              </h4>
              <div className="max-h-32 overflow-y-auto">
                <div className="space-y-2">
                  {scoreResult.missing_skills.slice(0, isMobile ? 10 : 8).map((skill: string, index: number) => (
                    <div key={index} className="flex items-center text-sm">
                      <span className="inline-flex items-center justify-center rounded-full bg-red-100 text-red-600 mr-2 flex-shrink-0 p-1">
                        <X className="h-3 w-3" />
                      </span>
                      <span className="text-red-700">{skill}</span>
                    </div>
                  ))}
                  {scoreResult.missing_skills.length > (isMobile ? 10 : 8) && (
                    <p className="text-xs text-red-600 italic pl-6">
                      +{scoreResult.missing_skills.length - (isMobile ? 10 : 8)} more skills
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Matched Skills */}
          {scoreResult.matched_skills && scoreResult.matched_skills.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-3 flex items-center text-sm">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                Matched Skills ({scoreResult.matched_skills.length})
              </h4>
              <div className="max-h-32 overflow-y-auto">
                <div className="space-y-2">
                  {scoreResult.matched_skills.slice(0, isMobile ? 10 : 8).map((skill: string, index: number) => (
                    <div key={index} className="flex items-center text-sm">
                      <span className="inline-flex items-center justify-center rounded-full bg-green-100 text-green-600 mr-2 flex-shrink-0 p-1">
                        <Check className="h-3 w-3" />
                      </span>
                      <span className="text-green-700">{skill}</span>
                    </div>
                  ))}
                  {scoreResult.matched_skills.length > (isMobile ? 10 : 8) && (
                    <p className="text-xs text-green-600 italic pl-6">
                      +{scoreResult.matched_skills.length - (isMobile ? 10 : 8)} more skills
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {scoreResult.recommendations && scoreResult.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center text-sm">
                <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
                AI Recommendations
              </h4>
              <div className="max-h-40 overflow-y-auto">
                <div className="space-y-3">
                  {scoreResult.recommendations.map((rec: string, idx: number) => (
                    <div key={idx} className="flex items-start text-sm">
                      <span className="inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mr-2 flex-shrink-0 p-1 mt-0.5">
                        <Sparkles className="h-3 w-3" />
                      </span>
                      <span className="text-blue-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          {showOptimizeButton && onOptimize && (
            <Button
              onClick={onOptimize}
              disabled={isOptimizing}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:bg-green-300"
            >
              {isOptimizing ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Optimizing Resume...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Optimize Resume
                </>
              )}
            </Button>
          )}
          
          <Button
            onClick={onStartOverAction}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            {showOptimizeButton ? "Analyze Another Resume" : "Optimize Another Resume"}
          </Button>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              {showOptimizeButton 
                ? "Your current resume analysis is shown on the left" 
                : "Your optimized resume is ready for download on the left"
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 