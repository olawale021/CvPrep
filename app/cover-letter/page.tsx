"use client";

import { Check, ClipboardCopy, Download, Send } from "lucide-react";
import React, { useRef, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { JobDescriptionInput } from "../../components/ui/JobDescriptionInput";
import { ResumeUpload } from "../../components/ui/ResumeUpload";
import Sidebar from "../../components/ui/Sidebar";

// Define type for API response
interface CoverLetterResponse {
  cover_letter: string;
  created_at: string;
  word_count: number;
  is_tailored: boolean;
  user_id?: string;
}

export default function CoverLetterGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>("");
  const [coverLetter, setCoverLetter] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "result">("upload");
  const coverLetterRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleJobDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJobDescription(event.target.value);
  };

  const generateCoverLetter = async () => {
    if (!jobDescription) {
      setError("Please enter a job description.");
      return;
    }

    if (!file) {
      setError("Please upload a resume.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("jobDescription", jobDescription);
      formData.append("resumeFile", file);

      const response = await fetch("/api/cover-letter", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to generate cover letter.");
      }

      const data: CoverLetterResponse = await response.json();
      
      if (data?.cover_letter) {
        setCoverLetter(data.cover_letter);
        setActiveTab("result");
      } else {
        throw new Error("Failed to generate cover letter.");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const downloadCoverLetter = () => {
    if (!coverLetter) return;
    
    const element = document.createElement("a");
    const file = new Blob([coverLetter], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "cover_letter.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopy = () => {
    if (!coverLetter) return;
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold text-black mb-2 text-center">Cover Letter Generator</h1>
          <p className="text-center text-black mb-8">Generate a tailored cover letter in seconds. Upload your resume and paste the job description below.</p>
          
          {/* Tab Switcher */}
          <div className="flex border-b mb-6">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "upload"
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-600 hover:text-blue-700 hover:border-blue-200"
              }`}
              onClick={() => setActiveTab("upload")}
            >
              Create
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "result"
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-600 hover:text-blue-700 hover:border-blue-200"
              }`}
              onClick={() => setActiveTab("result")}
              disabled={!coverLetter}
            >
              Result
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "upload" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Resume Upload</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResumeUpload
                    file={file}
                    onFileChange={setFile}
                    onRemoveFile={() => setFile(null)}
                  />
                </CardContent>
              </Card>
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <JobDescriptionInput
                    value={jobDescription}
                    onChange={handleJobDescriptionChange}
                    maxLength={2000}
                    error={error}
                  />
                  <Button
                    onClick={generateCoverLetter}
                    className="w-full mt-4"
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Generate Cover Letter
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "result" && (
            <Card className="shadow-lg border-blue-100">
              <CardHeader className="flex flex-row items-center justify-between bg-blue-50 rounded-t-xl">
                <CardTitle className="text-blue-700">Your Cover Letter</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCopy} disabled={!coverLetter} size="sm">
                    {copied ? <Check className="mr-2 h-4 w-4 text-green-600" /> : <ClipboardCopy className="mr-2 h-4 w-4" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button variant="outline" onClick={downloadCoverLetter} size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  ref={coverLetterRef}
                  className="bg-white p-6 rounded-lg border border-gray-100 whitespace-pre-line text-black text-base leading-relaxed shadow-inner min-h-[200px]"
                >
                  {coverLetter}
                </div>
                <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab("upload")}>Back to Editor</Button>
                  <Button onClick={downloadCoverLetter}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Cover Letter
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
