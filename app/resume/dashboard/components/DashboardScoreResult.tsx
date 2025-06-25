"use client";

import { ArrowRight, Check, FileText, RefreshCw, Sparkles, Star, X } from "lucide-react";
import { Button } from "../../../../components/ui/base/Button";
import { ResumeScore } from "../../../../lib/services/resume/scoreResume";

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
  showOptimizeButton = true,
  onOptimize,
  isOptimizing = false
}: DashboardScoreResultProps) {
  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-yellow-600"; 
    return "text-red-600";
  };

  const isOptimizedResume = scoreResult.optimization_validation !== undefined;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {isOptimizedResume ? 'Optimized Resume Score' : 'Resume Match Score'}
            </h3>
          </div>
          {isOptimizedResume && (
            <div className="flex items-center space-x-1">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-blue-600 font-medium">Optimized</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Score Display */}
        <div className="text-center mb-6">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={scoreResult.match_score >= 85 ? "#10b981" : scoreResult.match_score >= 70 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="8"
                  strokeDasharray={`${(scoreResult.match_score / 100) * 251.2} 251.2`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${getScoreColor(scoreResult.match_score)}`}>
                  {Math.round(scoreResult.match_score)}%
                </span>
                <span className="text-xs text-gray-500 mt-1">Match Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Optimization Validation for Optimized Resumes */}
        {isOptimizedResume && scoreResult.optimization_validation && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
              <Check className="h-4 w-4 mr-2" />
              Optimization Validation
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700">Target Score (≥90%):</span>
                <div className="flex items-center">
                  {scoreResult.optimization_validation.meets_target_score ? (
                    <Check className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <X className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={scoreResult.optimization_validation.meets_target_score ? "text-green-600" : "text-red-600"}>
                    {scoreResult.optimization_validation.meets_target_score ? "Met" : "Not Met"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700">Skills Demonstrated:</span>
                <span className="text-blue-900 font-medium">
                  {scoreResult.optimization_validation.skills_demonstrated || 0} skills
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Skills Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Matched Skills */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <h4 className="font-medium text-gray-900">Matched Skills</h4>
              <span className="text-sm text-gray-500">({scoreResult.matched_skills.length})</span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {scoreResult.matched_skills.length > 0 ? (
                scoreResult.matched_skills.map((skill, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">{skill}</span>
                  </div>
                ))
              ) : (
                <span className="text-sm text-gray-500 italic">No matched skills found</span>
              )}
            </div>
          </div>

          {/* Missing Skills */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <X className="h-4 w-4 text-red-500" />
              <h4 className="font-medium text-gray-900">Missing Skills</h4>
              <span className="text-sm text-gray-500">({scoreResult.missing_skills?.length || 0})</span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {scoreResult.missing_skills && scoreResult.missing_skills.length > 0 ? (
                scoreResult.missing_skills.map((skill, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    <span className="text-gray-700">{skill}</span>
                  </div>
                ))
              ) : (
                <span className="text-sm text-gray-500 italic">No missing skills - great job!</span>
              )}
            </div>
            {scoreResult.missing_skills && scoreResult.missing_skills.length > 0 && (
              <div className="mt-2 p-2 bg-red-50 rounded-md">
                <p className="text-xs text-red-700">
                  Consider adding these skills to improve your match score.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Skills Summary */}
        {(scoreResult.matched_skills?.length > 0 || scoreResult.missing_skills?.length > 0) && (
          <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
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
                <div className="text-sm font-medium text-gray-700">Skills Match</div>
                <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.round(((scoreResult.matched_skills?.length || 0) / ((scoreResult.matched_skills?.length || 0) + (scoreResult.missing_skills?.length || 0))) * 100) || 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {scoreResult.recommendations && scoreResult.recommendations.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Star className="h-4 w-4 text-yellow-500 mr-2" />
              Recommendations
            </h4>
            <div className="space-y-2">
              {scoreResult.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {showOptimizeButton && !isOptimizedResume && (
            <Button
              onClick={onOptimize}
              disabled={isOptimizing}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              {isOptimizing ? (
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <div className="flex space-x-1">
                    <div className="h-3 w-16 bg-white/30 rounded animate-pulse"></div>
                    <div className="h-3 w-12 bg-white/20 rounded animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Optimize Resume
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
          
          <Button
            onClick={onStartOverAction}
            variant="outline"
            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Start Over
          </Button>
        </div>
      </div>
    </div>
  );
} 