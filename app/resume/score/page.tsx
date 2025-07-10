"use client";

import { FileText, Target, Zap } from "lucide-react";
import { FormEvent, useState } from "react";
import { UsageWarning } from "../../../components/features/dashboard/UsageWarning";
import { ResumeUpload } from "../../../components/features/resume/ResumeUpload";
import Sidebar from "../../../components/layout/Sidebar";
import { Alert } from "../../../components/ui/base/Alert";
import { Button } from "../../../components/ui/base/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/base/Card";
import { Textarea } from "../../../components/ui/base/Textarea";
import { LoadingSpinner } from "../../../components/ui/feedback/LoadingSpinner";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/auth/supabaseClient";
import { ResumeScore } from "../../../lib/services/resume/resumeUtils/scoreResume";
import ScoreResult from "../optimize/components/ScoreResult";

export default function ResumeScorePage() {
  const { user } = useAuth();
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [scoreResult, setScoreResult] = useState<ResumeScore | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!resumeFile || !jobDescription.trim()) {
      setError("Please upload a resume and provide a job description");
      return;
    }

    setError(null);
    setIsScoring(true);
    setScoreResult(null);

    try {
      // Get the session token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const formData = new FormData();
      formData.append('file', resumeFile);
      formData.append('job', jobDescription.trim());

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
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to score resume');
      }
      
      setScoreResult(data);
    } catch (err) {
      console.error('Error scoring resume:', err);
      setError(err instanceof Error ? err.message : 'Failed to score resume');
    } finally {
      setIsScoring(false);
    }
  };

  const isFormValid = resumeFile && jobDescription.trim().length > 0;

  // Authentication check
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to access the resume scorer.</p>
            <Button 
              onClick={() => window.location.href = '/login'}
              className="w-full bg-slate-800 hover:bg-slate-700"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 px-6 py-4 flex-shrink-0">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
                  Resume Scorer
                </h1>
                <p className="text-slate-600 text-sm">
                  Get your resume match score against any job description
                </p>
              </div>
            </div>
            
            {/* Feature highlights */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 px-2.5 py-1 rounded-full border border-blue-200/50">
                <Target className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Match Analysis</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-green-50 to-emerald-50 px-2.5 py-1 rounded-full border border-green-200/50">
                <Zap className="w-3 h-3 text-green-600" />
                <span className="text-xs font-medium text-green-700">Instant Scoring</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-50 to-pink-50 px-2.5 py-1 rounded-full border border-purple-200/50">
                <FileText className="w-3 h-3 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">Detailed Feedback</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <UsageWarning feature="resume_create" className="mb-6" />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
              {/* Input Section */}
              <div className="space-y-6 h-fit">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Job Description Card */}
                  <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200/50">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                          <Target className="w-4 h-4 text-white" />
                        </div>
                        Job Description
                      </CardTitle>
                      <p className="text-slate-600 text-sm">
                        Paste the job posting you want to match against
                      </p>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Paste the complete job description here..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        rows={6}
                        className="w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl text-sm resize-none"
                        required
                      />
                    </CardContent>
                  </Card>

                  {/* Resume Upload Card */}
                  <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        Your Resume
                      </CardTitle>
                      <p className="text-slate-600 text-xs">
                        Upload your resume for scoring analysis
                      </p>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <ResumeUpload 
                        file={resumeFile}
                        onFileChange={(file: File | null) => {
                          setResumeFile(file);
                        }}
                        onRemoveFile={() => {
                          setResumeFile(null);
                        }}
                      />
                      
                      {resumeFile && (
                        <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 mt-3 py-2">
                          <FileText className="h-3 w-3 text-green-600" />
                          <div className="text-green-800">
                            <div className="font-medium text-sm">{resumeFile.name}</div>
                            <div className="text-xs mt-0.5">
                              {(resumeFile.size / 1024).toFixed(1)} KB • Ready for scoring
                            </div>
                          </div>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  {/* Score Button */}
                  <Button 
                    type="submit"
                    disabled={isScoring || !isFormValid}
                    className="w-full h-14 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02]"
                    size="lg"
                  >
                    {isScoring ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-3" />
                        Scoring Resume...
                      </>
                    ) : (
                      <>
                        <Target className="w-5 h-5 mr-3" />
                        Score My Resume
                      </>
                    )}
                  </Button>
                </form>
              </div>

              {/* Result Section */}
              <div className="flex flex-col">
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200/50 flex flex-col">
                  <CardHeader className="pb-4 flex-shrink-0">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      Resume Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col">
                    {error && (
                      <Alert className="mb-6 bg-gradient-to-r from-red-50 to-rose-50 border-red-200 flex-shrink-0">
                        <FileText className="h-4 w-4 text-red-600" />
                        <div className="text-red-800 font-medium">{error}</div>
                      </Alert>
                    )}

                    {isScoring && (
                      <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
                          <Target className="w-8 h-8 text-white" />
                        </div>
                        <LoadingSpinner size="lg" className="mb-4" />
                        <p className="text-slate-600 font-medium">Analyzing your resume...</p>
                        <p className="text-sm text-slate-500 mt-2">This may take a few moments</p>
                      </div>
                    )}

                    {scoreResult && !isScoring && (
                      <div className="max-h-[calc(100vh-250px)] overflow-auto">
                        <ScoreResult
                          scoreResult={scoreResult}
                          handleOptimize={() => {}} // No optimize functionality in score-only page
                          loading={false}
                          setScoreResult={setScoreResult}
                          file={resumeFile}
                          jobDescription={jobDescription}
                          showOptimizeButton={false}
                        />
                      </div>
                    )}

                    {!scoreResult && !isScoring && !error && (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6">
                          <Target className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">
                          Ready to Score
                        </h3>
                        <p className="text-slate-500 max-w-sm">
                          Upload your resume and paste a job description to get your match score
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 