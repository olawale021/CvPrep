"use client";

import { HelpCircle, Info, MessageSquare, Send, Users } from "lucide-react";
import React, { useRef, useState } from "react";
import { ResumeUpload } from "../../components/features/resume/ResumeUpload";
import Sidebar from "../../components/layout/Sidebar";
import { Alert, AlertDescription } from "../../components/ui/base/Alert";
import { Badge } from "../../components/ui/base/Badge";
import { Button } from "../../components/ui/base/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/base/Card";
import { Input } from "../../components/ui/base/Input";
import { Textarea } from "../../components/ui/base/Textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/composite/accordion";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/auth/supabaseClient";

type Question = string;
type Answer = string;

interface QuestionCategory {
  technical_questions: string[];
  behavioral_questions: string[];
  situational_questions: string[];
  role_specific_questions: string[];
  culture_fit_questions: string[];
}

interface QuestionsResponse {
  questions: QuestionCategory;
  metadata: {
    job_analyzed: boolean;
    resume_analyzed: boolean;
    question_count: number;
    categories: number;
  };
}

interface AnswerTips {
  answer_structure: string[];
  key_points: string[];
  skills_to_emphasize: string[];
  mistakes_to_avoid: string[];
  example_answer: string;
}

interface AnswerTipsResponse {
  question: string;
  answer_tips: AnswerTips;
}

interface AnswerFeedback {
  question: string;
  strengths: string[];
  improvements: string[];
  score: number;
  better_answer: string;
}

interface SimulationResponse {
  answer_feedback: AnswerFeedback[];
  overall_evaluation: {
    score: number;
    strengths: string[];
    improvements: string[];
    recommendation: string;
  };
}

export default function InterviewPrep() {
  const { user, isLoading: authLoading } = useAuth();
  
  // File and input states
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>("");
  const [questionCount, setQuestionCount] = useState<number>(5);
  
  // Questions and answers states
  const [questionsResponse, setQuestionsResponse] = useState<QuestionsResponse | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string>("");
  const [answerTips, setAnswerTips] = useState<AnswerTipsResponse | null>(null);
  
  // Simulation states
  const [simulationQuestions, setSimulationQuestions] = useState<Question[]>([]);
  const [simulationAnswers, setSimulationAnswers] = useState<Answer[]>([]);
  const [simulationResults, setSimulationResults] = useState<SimulationResponse | null>(null);
  
  // UI states
  const [activeTab, setActiveTab] = useState<string>("generate");
  const [loading, setLoading] = useState<boolean>(false);
  const [tipsLoading, setTipsLoading] = useState<boolean>(false);
  const [simulationLoading, setSimulationLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const questionsRef = useRef<HTMLDivElement>(null);
  const tipsRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<HTMLDivElement>(null);

  // Redirect to login if not authenticated
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to access interview preparation.</p>
            <Button 
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleJobDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJobDescription(event.target.value);
  };

  const handleQuestionCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(event.target.value);
    if (!isNaN(count) && count >= 1 && count <= 10) {
      setQuestionCount(count);
    }
  };

  const generateQuestions = async () => {
    if (!jobDescription) {
      setError("Please enter a job description.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get the session token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      // Create FormData
      const formData = new FormData();
      formData.append("job_description", jobDescription);
      formData.append("question_count", questionCount.toString());
      
      if (file) {
        formData.append("resume_file", file);
      }

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch("/api/interview/questions", {
        method: "POST",
        body: formData,
        headers
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && !data.error) {
        setQuestionsResponse(data);
        setActiveTab("questions");
        // Scroll to questions section
        if (questionsRef.current) {
          questionsRef.current.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        throw new Error(data.error || "Failed to generate interview questions.");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const getAnswerTips = async (question: string) => {
    if (!question || !jobDescription) {
      setError("Question and job description are required.");
      return;
    }

    setTipsLoading(true);
    setError(null);
    setSelectedQuestion(question);
    setActiveTab("tips");

    try {
      // Get the session token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const formData = new FormData();
      formData.append("question", question);
      formData.append("job_description", jobDescription);

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch("/api/interview/answer-tips", {
        method: "POST",
        body: formData,
        headers
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data && !data.error) {
        setAnswerTips(data);
        // Scroll to tips section
        if (tipsRef.current) {
          tipsRef.current.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        throw new Error(data.error || "Failed to generate answer tips.");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setTipsLoading(false);
    }
  };

  const addQuestionToSimulation = (question: string) => {
    if (!simulationQuestions.includes(question)) {
      setSimulationQuestions([...simulationQuestions, question]);
      setSimulationAnswers([...simulationAnswers, ""]);
    }
  };

  const handleAnswerChange = (index: number, answer: string) => {
    const newAnswers = [...simulationAnswers];
    newAnswers[index] = answer;
    setSimulationAnswers(newAnswers);
  };

  const removeQuestionFromSimulation = (index: number) => {
    const newQuestions = [...simulationQuestions];
    const newAnswers = [...simulationAnswers];
    newQuestions.splice(index, 1);
    newAnswers.splice(index, 1);
    setSimulationQuestions(newQuestions);
    setSimulationAnswers(newAnswers);
  };

  const runSimulation = async () => {
    if (simulationQuestions.length === 0) {
      setError("Please add at least one question to the simulation.");
      return;
    }

    if (simulationQuestions.some((_, i) => !simulationAnswers[i])) {
      setError("Please provide answers for all questions.");
      return;
    }

    setSimulationLoading(true);
    setError(null);

    try {
      // Get the session token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const formData = new FormData();
      formData.append("job_description", jobDescription);
      
      simulationQuestions.forEach((q) => {
        formData.append("questions", q);
      });
      
      simulationAnswers.forEach((a) => {
        formData.append("answers", a);
      });

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch("/api/interview/simulate", {
        method: "POST",
        body: formData,
        headers
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data && !data.error) {
        setSimulationResults(data);
        setActiveTab("results");
        // Scroll to results section
        if (simulationRef.current) {
          simulationRef.current.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        throw new Error(data.error || "Failed to simulate interview.");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setSimulationLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-emerald-500";
    if (score >= 4) return "text-amber-500";
    if (score >= 2) return "text-orange-500";
    return "text-red-500";
  };

  const resetAll = () => {
    setActiveTab("generate");
    setQuestionsResponse(null);
    setSelectedQuestion("");
    setAnswerTips(null);
    setSimulationQuestions([]);
    setSimulationAnswers([]);
    setSimulationResults(null);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 pt-16 md:pt-6 overflow-x-hidden">
        <div className="max-w-5xl mx-auto">
          {/* Header - Make it stack on mobile */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-black">Interview Preparation</h1>
            <Button 
              variant="outline" 
              onClick={resetAll}
              className="text-sm w-full sm:w-auto"
            >
              Reset All
            </Button>
          </div>

          {/* Tabs Navigation - Make it scrollable on mobile */}
          <div className="border-b mb-6 overflow-x-auto">
            <div className="flex space-x-4 min-w-max pb-2">
              <button
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "generate"
                    ? "border-blue-600 text-black"
                    : "border-transparent text-black hover:text-blue-700 hover:border-blue-200"
                }`}
                onClick={() => setActiveTab("generate")}
              >
                Generate
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "questions"
                    ? "border-blue-600 text-black"
                    : "border-transparent text-black hover:text-blue-700 hover:border-blue-200"
                }`}
                onClick={() => setActiveTab("questions")}
                disabled={!questionsResponse}
              >
                Questions
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "tips"
                    ? "border-blue-600 text-black"
                    : "border-transparent text-black hover:text-blue-700 hover:border-blue-200"
                }`}
                onClick={() => setActiveTab("tips")}
                disabled={!answerTips}
              >
                Answer Tips
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "simulation"
                    ? "border-blue-600 text-black"
                    : "border-transparent text-black hover:text-blue-700 hover:border-blue-200"
                }`}
                onClick={() => setActiveTab("simulation")}
                disabled={simulationQuestions.length === 0}
              >
                Simulation
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "results"
                    ? "border-blue-600 text-black"
                    : "border-transparent text-black hover:text-blue-700 hover:border-blue-200"
                }`}
                onClick={() => setActiveTab("results")}
                disabled={!simulationResults}
              >
                Results
              </button>
            </div>
          </div>

          {/* Generate Tab Content - Stack cards on mobile */}
          {activeTab === "generate" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Resume Upload Card */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Resume Information</CardTitle>
                  <CardDescription>
                    Upload your resume (optional)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResumeUpload
                    file={file}
                    onFileChange={setFile}
                    onRemoveFile={() => setFile(null)}
                  />
                </CardContent>
              </Card>

              {/* Job Description Card */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Job Information</CardTitle>
                  <CardDescription>
                    Enter the job description to generate tailored questions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Paste the job description here..."
                    className="min-h-[180px]"
                    value={jobDescription}
                    onChange={handleJobDescriptionChange}
                  />
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-black text-sm font-medium flex items-center">
                        Questions per category
                        <Info className="h-4 w-4 ml-2 text-gray-400" />
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={questionCount}
                        onChange={handleQuestionCountChange}
                        className="w-20 text-center"
                      />
                    </div>
                  </div>

                  {error && (
                    <Alert className="bg-red-50 border-red-200">
                      <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    onClick={generateQuestions} 
                    className="w-full" 
                    disabled={loading || !jobDescription}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 mr-2 bg-white/30 rounded animate-pulse"></div>
                        Generating Questions...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Generate Interview Questions
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Questions Tab - Adjust question items for mobile */}
          {activeTab === "questions" && (
            <div ref={questionsRef}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-black">Interview Questions</CardTitle>
                  <CardDescription className="text-black">
                    {questionsResponse?.metadata?.question_count} questions per category
                    {questionsResponse?.metadata?.resume_analyzed ? " (tailored to your resume)" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {questionsResponse && (
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="technical">
                        <AccordionTrigger>
                          <div className="flex items-center">
                            <Badge className="mr-2 bg-blue-500">Technical</Badge>
                            <span className="text-black">Technical Questions</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-4">
                            {questionsResponse.questions.technical_questions.map((question, index) => (
                              <li key={`tech-${index}`} className="p-3 bg-gray-50 rounded-md">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                                  <p className="text-black">{question}</p>
                                  <div className="flex gap-2 w-full sm:w-auto">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => getAnswerTips(question)}
                                      className="flex-1 sm:flex-none"
                                    >
                                      <HelpCircle className="h-4 w-4 mr-1" />
                                      Tips
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => addQuestionToSimulation(question)}
                                      className="flex-1 sm:flex-none"
                                    >
                                      <MessageSquare className="h-4 w-4 mr-1" />
                                      Practice
                                    </Button>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="behavioral">
                        <AccordionTrigger>
                          <div className="flex items-center">
                            <Badge className="mr-2 bg-green-500">Behavioral</Badge>
                            <span className="text-black">Behavioral Questions</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-4">
                            {questionsResponse.questions.behavioral_questions.map((question, index) => (
                              <li key={`behav-${index}`} className="p-3 bg-gray-50 rounded-md">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                                  <p className="text-black">{question}</p>
                                  <div className="flex gap-2 w-full sm:w-auto">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => getAnswerTips(question)}
                                      className="flex-1 sm:flex-none"
                                    >
                                      <HelpCircle className="h-4 w-4 mr-1" />
                                      Tips
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => addQuestionToSimulation(question)}
                                      className="flex-1 sm:flex-none"
                                    >
                                      <MessageSquare className="h-4 w-4 mr-1" />
                                      Practice
                                    </Button>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="situational">
                        <AccordionTrigger>
                          <div className="flex items-center">
                            <Badge className="mr-2 bg-amber-500">Situational</Badge>
                            <span className="text-black">Situational Questions</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-4">
                            {questionsResponse.questions.situational_questions.map((question, index) => (
                              <li key={`sit-${index}`} className="p-3 bg-gray-50 rounded-md">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                                  <p className="text-black">{question}</p>
                                  <div className="flex gap-2 w-full sm:w-auto">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => getAnswerTips(question)}
                                      className="flex-1 sm:flex-none"
                                    >
                                      <HelpCircle className="h-4 w-4 mr-1" />
                                      Tips
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => addQuestionToSimulation(question)}
                                      className="flex-1 sm:flex-none"
                                    >
                                      <MessageSquare className="h-4 w-4 mr-1" />
                                      Practice
                                    </Button>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="role">
                        <AccordionTrigger>
                          <div className="flex items-center">
                            <Badge className="mr-2 bg-purple-500">Role</Badge>
                            <span className="text-black">Role-Specific Questions</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-4">
                            {questionsResponse.questions.role_specific_questions.map((question, index) => (
                              <li key={`role-${index}`} className="p-3 bg-gray-50 rounded-md">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                                  <p className="text-black">{question}</p>
                                  <div className="flex gap-2 w-full sm:w-auto">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => getAnswerTips(question)}
                                      className="flex-1 sm:flex-none"
                                    >
                                      <HelpCircle className="h-4 w-4 mr-1" />
                                      Tips
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => addQuestionToSimulation(question)}
                                      className="flex-1 sm:flex-none"
                                    >
                                      <MessageSquare className="h-4 w-4 mr-1" />
                                      Practice
                                    </Button>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="culture">
                        <AccordionTrigger>
                          <div className="flex items-center">
                            <Badge className="mr-2 bg-pink-500">Culture</Badge>
                            <span className="text-black">Culture Fit Questions</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-4">
                            {questionsResponse.questions.culture_fit_questions.map((question, index) => (
                              <li key={`culture-${index}`} className="p-3 bg-gray-50 rounded-md">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                                  <p className="text-black">{question}</p>
                                  <div className="flex gap-2 w-full sm:w-auto">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => getAnswerTips(question)}
                                      className="flex-1 sm:flex-none"
                                    >
                                      <HelpCircle className="h-4 w-4 mr-1" />
                                      Tips
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => addQuestionToSimulation(question)}
                                      className="flex-1 sm:flex-none"
                                    >
                                      <MessageSquare className="h-4 w-4 mr-1" />
                                      Practice
                                    </Button>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                  
                  {/* Navigation buttons - Stack on mobile */}
                  <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab("generate")}
                      className="w-full sm:w-auto"
                    >
                      Back to Generator
                    </Button>
                    <Button 
                      onClick={() => setActiveTab("simulation")} 
                      disabled={simulationQuestions.length === 0}
                      className="w-full sm:w-auto"
                    >
                      Go to Practice Simulation
                      {simulationQuestions.length > 0 && (
                        <Badge className="ml-2 bg-blue-500">{simulationQuestions.length}</Badge>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Answer Tips Tab */}
          {activeTab === "tips" && (
            <div ref={tipsRef}>
              <Card>
                <CardHeader>
                  <CardTitle>Answer Tips</CardTitle>
                  <CardDescription>
                    Guidance for answering: {selectedQuestion}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tipsLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-8 h-8 bg-gray-200 rounded animate-pulse mb-4"></div>
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ) : answerTips ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2 text-black">Answer Structure</h3>
                        <ol className="list-decimal pl-5 space-y-1 text-black">
                          {answerTips.answer_tips.answer_structure.map((step, index) => (
                            <li key={index} className="text-black">{step}</li>
                          ))}
                        </ol>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2 text-black">Key Points to Include</h3>
                        <ul className="list-disc pl-5 space-y-1 text-black">
                          {answerTips.answer_tips.key_points.map((point, index) => (
                            <li key={index} className="text-black">{point}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2 text-black">Skills to Emphasize</h3>
                        <div className="flex flex-wrap gap-2">
                          {answerTips.answer_tips.skills_to_emphasize.map((skill, index) => (
                            <Badge key={index} variant="outline" className="bg-blue-50 text-black">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2 text-black">Mistakes to Avoid</h3>
                        <ul className="list-disc pl-5 space-y-1 text-black">
                          {answerTips.answer_tips.mistakes_to_avoid.map((mistake, index) => (
                            <li key={index} className="text-black">{mistake}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2 text-black">Example Answer</h3>
                        <div className="p-4 bg-gray-50 rounded-md italic text-black">
                          {answerTips.answer_tips.example_answer}
                        </div>
                      </div>
                      
                      <div className="flex justify-between mt-6">
                        <Button variant="outline" onClick={() => setActiveTab("questions")}>
                          Back to Questions
                        </Button>
                        <Button onClick={() => addQuestionToSimulation(selectedQuestion)}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Add to Practice Simulation
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p>No answer tips available. Please select a question first.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Simulation Tab - Adjust answer boxes for mobile */}
          {activeTab === "simulation" && (
            <Card>
              <CardHeader>
                <CardTitle>Practice Simulation</CardTitle>
                <CardDescription>
                  Answer the questions as you would in a real interview
                </CardDescription>
              </CardHeader>
              <CardContent>
                {simulationQuestions.length > 0 ? (
                  <div className="space-y-6">
                    {simulationQuestions.map((question, index) => (
                      <div key={index} className="p-4 border rounded-md">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                          <h3 className="font-medium text-black">{index + 1}. {question}</h3>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeQuestionFromSimulation(index)}
                            className="text-red-500 hover:text-red-700 w-full sm:w-auto"
                          >
                            Remove
                          </Button>
                        </div>
                        <Textarea
                          placeholder="Type your answer here..."
                          className="min-h-[120px] text-black mt-2"
                          value={simulationAnswers[index]}
                          onChange={(e) => handleAnswerChange(index, e.target.value)}
                        />
                        <div className="flex justify-end mt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => getAnswerTips(question)}
                            className="w-full sm:w-auto"
                          >
                            <HelpCircle className="h-4 w-4 mr-1" />
                            Get Tips
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {error && (
                      <Alert className="bg-red-50 border-red-200">
                        <AlertDescription className="text-red-700">{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    {/* Navigation buttons - Stack on mobile */}
                    <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab("questions")}
                        className="w-full sm:w-auto"
                      >
                        Back to Questions
                      </Button>
                      <Button 
                        onClick={runSimulation}
                        disabled={simulationLoading || simulationQuestions.some((_, i) => !simulationAnswers[i])}
                        className="w-full sm:w-auto"
                      >
                        {simulationLoading ? (
                          <>
                            <div className="w-4 h-4 mr-2 bg-white/30 rounded animate-pulse"></div>
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Run Simulation
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p>No questions added to simulation. Add questions from the Question tab.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Results Tab - Adjust feedback sections for mobile */}
          {activeTab === "results" && (
            <Card>
              <CardHeader>
                <CardTitle>Simulation Results</CardTitle>
                <CardDescription>
                  Overall evaluation and answer feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                {simulationResults ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2 text-black">Overall Evaluation</h3>
                      <p className={`${getScoreColor(simulationResults.overall_evaluation.score)} text-black`}>
                        Score: {simulationResults.overall_evaluation.score}/10
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2 text-black">Strengths</h3>
                      <ul className="list-disc pl-5 space-y-1 text-black">
                        {Array.isArray(simulationResults.overall_evaluation.strengths) ? 
                          simulationResults.overall_evaluation.strengths.map((strength, index) => (
                            <li key={index} className="text-black">{strength}</li>
                          )) : 
                          <li className="text-black">{simulationResults.overall_evaluation.strengths}</li>
                        }
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2 text-black">Improvements</h3>
                      <ul className="list-disc pl-5 space-y-1 text-black">
                        {Array.isArray(simulationResults.overall_evaluation.improvements) ? 
                          simulationResults.overall_evaluation.improvements.map((improvement, index) => (
                            <li key={index} className="text-black">{improvement}</li>
                          )) :
                          <li className="text-black">{simulationResults.overall_evaluation.improvements}</li>
                        }
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2 text-black">Recommendation</h3>
                      <p className="italic text-black">
                        {simulationResults.overall_evaluation.recommendation}
                      </p>
                    </div>
                    
                    {/* Answer Feedback - Adjust for mobile */}
                    <div>
                      <h3 className="text-lg font-medium mb-2 text-black">Answer Feedback</h3>
                      <div className="space-y-4">
                        {simulationResults.answer_feedback.map((feedback, index) => (
                          <div key={index} className="p-4 border rounded-md">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                              <p className="font-medium text-black">{feedback.question}</p>
                              <Badge className="bg-blue-500 w-full sm:w-auto text-center">
                                {feedback.score}/10
                              </Badge>
                            </div>
                            
                            <div className="mt-3">
                              <h4 className="font-medium mb-1 text-black">Strengths</h4>
                              <ul className="list-disc pl-5 space-y-1 text-black">
                                {Array.isArray(feedback.strengths) ? 
                                  feedback.strengths.map((strength, index) => (
                                    <li key={index} className="text-black">{strength}</li>
                                  )) : 
                                  <li className="text-black">{feedback.strengths}</li>
                                }
                              </ul>
                            </div>
                            
                            <div className="mt-3">
                              <h4 className="font-medium mb-1 text-black">Improvements</h4>
                              <ul className="list-disc pl-5 space-y-1 text-black">
                                {Array.isArray(feedback.improvements) ? 
                                  feedback.improvements.map((improvement, index) => (
                                    <li key={index} className="text-black">{improvement}</li>
                                  )) : 
                                  <li className="text-black">{feedback.improvements}</li>
                                }
                              </ul>
                            </div>
                            
                            <div className="mt-3">
                              <h4 className="font-medium mb-1 text-black">Better Answer Example</h4>
                              <p className="italic bg-gray-50 p-3 rounded-md text-black">
                                {feedback.better_answer}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Navigation buttons - Stack on mobile */}
                    <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab("simulation")}
                        className="w-full sm:w-auto"
                      >
                        Back to Practice
                      </Button>
                      <Button 
                        onClick={resetAll} 
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        Start Over
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p>No results available. Please run the simulation first.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
