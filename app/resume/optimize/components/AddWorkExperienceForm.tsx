"use client";

import { ArrowRight, Briefcase, Building2, CheckCircle, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../../../components/ui/base/Button";

interface AddedExperience {
  company: string;
  role: string;
  accomplishments: string[];
}

interface AddWorkExperienceFormProps {
  onSubmitAction: (data: { jobTitle: string; company: string; achievements: string }) => Promise<AddedExperience>;
  onCancelAction: () => void;
  onProceedToScoreAction: () => void;
  loading: boolean;
}

export default function AddWorkExperienceForm({ 
  onSubmitAction, 
  onCancelAction, 
  onProceedToScoreAction,
  loading 
}: AddWorkExperienceFormProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [achievements, setAchievements] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addedExperience, setAddedExperience] = useState<AddedExperience | null>(null);

  // Auto-close after 10 seconds when success is shown (increased time to read)
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        onCancelAction();
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [success, onCancelAction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !company.trim() || submitting) return;
    
    setSubmitting(true);
    
    try {
      const result = await onSubmitAction({
        jobTitle: jobTitle.trim(),
        company: company.trim(),
        achievements: achievements.trim()
      });
      
      setAddedExperience(result);
      setSuccess(true);
    } catch (error) {
      console.error('Error adding work experience:', error);
      // Don't set success on error
    } finally {
      setSubmitting(false);
    }
  };

  const handleProceedToScore = () => {
    onProceedToScoreAction();
    onCancelAction(); // Close the modal
  };

  if (success && addedExperience) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Experience Added Successfully!</h2>
              </div>
              <button
                onClick={onCancelAction}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-green-800 mb-2">Work Experience Added</h4>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <h5 className="font-semibold text-gray-900 mb-1">{addedExperience.role}</h5>
                    <p className="text-gray-700 text-sm mb-2">{addedExperience.company}</p>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-600 mb-1">Generated Achievements:</p>
                      {addedExperience.accomplishments.map((achievement, index) => (
                        <div key={index} className="flex items-start text-xs text-gray-700">
                          <span className="mr-2 text-green-600">•</span>
                          <span>{achievement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-800 mb-2">Ready to Score Your Updated Resume!</h4>
              <p className="text-blue-700 text-sm mb-3">
                Your resume now includes this new work experience. Click below to automatically score your updated resume with the new experience included.
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleProceedToScore}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Proceed to Score Resume
              </Button>
              <Button
                onClick={onCancelAction}
                variant="outline"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-2">
              This dialog will close automatically in 10 seconds
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isLoading = loading || submitting;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Add Work Experience</h2>
            </div>
            <button
              onClick={onCancelAction}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              disabled={isLoading}
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-blue-800 text-sm">
              <strong>Low work experience detected.</strong> Add relevant work experience to improve your resume score. 
              Our AI will generate professional achievements if you leave the achievements field empty.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
                Job Title *
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Software Developer, Marketing Manager"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                Company *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g., Google, Microsoft, Startup Inc."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="achievements" className="block text-sm font-medium text-gray-700 mb-1">
                Achievements (Optional)
              </label>
              <div className="relative">
                <Sparkles className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  id="achievements"
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  placeholder="Leave empty for AI-generated achievements, or describe your key accomplishments..."
                  rows={3}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                💡 Tip: Leave empty and our AI will generate professional achievements based on the job title
              </p>
            </div>

            <div className="flex space-x-3 pt-2">
              <Button
                type="submit"
                disabled={isLoading || !jobTitle.trim() || !company.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 mr-2 bg-white/30 rounded animate-pulse" />
                    Adding Experience...
                  </>
                ) : (
                  <>
                    <Briefcase className="h-4 w-4 mr-2" />
                    Add Experience
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={onCancelAction}
                disabled={isLoading}
                variant="outline"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 