"use client";

import { AlertCircle, ArrowRight, Check, Copy, Download, FileText, Sparkles, Target, Zap } from 'lucide-react';
import { useState } from 'react';
import { UsageWarning } from '../../components/features/dashboard/UsageWarning';
import { ResumeUpload } from '../../components/features/resume/ResumeUpload';
import Sidebar from '../../components/layout/Sidebar';
import { Alert } from '../../components/ui/base/Alert';
import { Badge } from '../../components/ui/base/Badge';
import { Button } from '../../components/ui/base/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/base/Card';
import { Textarea } from '../../components/ui/base/Textarea';
import { LoadingSpinner } from '../../components/ui/feedback/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

interface PersonalStatementResult {
  personal_statement: string;
  created_at: string;
  word_count: number;
  is_tailored: boolean;
  user_id?: string;
}

export default function PersonalStatementPage() {
  const { user } = useAuth();
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [result, setResult] = useState<PersonalStatementResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }

    if (!resumeText.trim() && !resumeFile) {
      setError('Please provide your resume text or upload a resume file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('jobDescription', jobDescription);
      formData.append('userId', user?.id || '');
      
      if (resumeFile) {
        formData.append('resumeFile', resumeFile);
      } else {
        formData.append('resumeText', resumeText);
      }

      const response = await fetch('/api/personal-statement', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate personal statement');
      }

      setResult(data);
    } catch (err) {
      console.error('Personal statement generation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (result?.personal_statement) {
      await navigator.clipboard.writeText(result.personal_statement);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (result?.personal_statement) {
      const blob = new Blob([result.personal_statement], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'personal-statement.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 px-6 py-6 flex-shrink-0">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                  Personal Statement Generator
                </h1>
                <p className="text-slate-600 font-medium">
                  Create compelling personal statements with AI-powered insights
                </p>
              </div>
            </div>
            
            {/* Feature highlights */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1.5 rounded-full border border-blue-200/50">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Tailored to Job</span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-1.5 rounded-full border border-green-200/50">
                <Zap className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">AI-Powered</span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 px-3 py-1.5 rounded-full border border-purple-200/50">
                <FileText className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">Professional Quality</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <UsageWarning feature="personal_statement_create" className="mb-8" />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-full">
              {/* Input Section */}
              <div className="space-y-6 h-fit">
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
                      Paste the job posting you&apos;re applying for
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Paste the complete job description here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      rows={6}
                      className="w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl text-sm resize-none"
                    />
                  </CardContent>
                </Card>

                {/* Resume Upload Card */}
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      Your Resume
                    </CardTitle>
                    <p className="text-slate-600 text-sm">
                      Upload your resume for personalized analysis
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ResumeUpload 
                      file={resumeFile}
                      onFileChange={(file: File | null) => {
                        setResumeFile(file);
                        if (file) {
                          setResumeText('');
                        }
                      }}
                      onRemoveFile={() => {
                        setResumeFile(null);
                      }}
                    />
                    
                    {resumeFile && (
                      <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                        <FileText className="h-4 w-4 text-green-600" />
                        <div className="text-green-800">
                          <div className="font-semibold">{resumeFile.name}</div>
                          <div className="text-sm mt-1">
                            {(resumeFile.size / 1024).toFixed(1)} KB • Ready for analysis
                          </div>
                        </div>
                      </Alert>
                    )}
                    
                  </CardContent>
                </Card>

                {/* Generate Button */}
                <Button 
                  onClick={handleGenerate}
                  disabled={loading || !jobDescription.trim() || (!resumeText.trim() && !resumeFile)}
                  className="w-full h-14 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02]"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-3" />
                      Generating Personal Statement...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-3" />
                      Generate Personal Statement
                      <ArrowRight className="w-5 h-5 ml-3" />
                    </>
                  )}
                </Button>
              </div>

              {/* Result Section */}
              <div className="flex flex-col">
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200/50 flex flex-col">
                  <CardHeader className="pb-4 flex-shrink-0">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xl">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        Your Personal Statement
                      </div>
                      {result && (
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                            {result.word_count} words
                          </Badge>
                          {result.is_tailored && (
                            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                              ✨ Tailored
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col">
                    {error && (
                      <Alert className="mb-6 bg-gradient-to-r from-red-50 to-rose-50 border-red-200 flex-shrink-0">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <div className="text-red-800 font-medium">{error}</div>
                      </Alert>
                    )}

                    {loading && (
                      <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
                          <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <LoadingSpinner size="lg" className="mb-4" />
                        <p className="text-slate-600 font-medium">Crafting your personal statement...</p>
                        <p className="text-sm text-slate-500 mt-2">This may take a few moments</p>
                      </div>
                    )}

                    {result && !loading && (
                      <div className="flex flex-col space-y-6 h-full">
                        <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 p-6 rounded-xl border border-slate-200/50 max-h-[calc(100vh-400px)] overflow-auto">
                          <pre className="whitespace-pre-wrap text-slate-800 font-sans leading-relaxed text-base">
                            {result.personal_statement}
                          </pre>
                        </div>
                        
                        <div className="flex gap-3 flex-shrink-0">
                          <Button
                            onClick={handleCopy}
                            variant="outline"
                            className="flex items-center gap-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                          >
                            {copied ? (
                              <>
                                <Check className="w-4 h-4 text-green-600" />
                                <span className="text-green-600 font-medium">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy Text
                              </>
                            )}
                          </Button>
                          
                          <Button
                            onClick={handleDownload}
                            variant="outline"
                            className="flex items-center gap-2 border-slate-200 hover:border-green-300 hover:bg-green-50"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                    )}

                    {!result && !loading && !error && (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6">
                          <Sparkles className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">
                          Ready to Generate
                        </h3>
                        <p className="text-slate-500 max-w-sm">
                          Upload your resume and paste a job description to create a compelling personal statement
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