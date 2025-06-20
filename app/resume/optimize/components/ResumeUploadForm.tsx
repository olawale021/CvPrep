import { FormEvent, RefObject, useState } from "react";

interface ResumeUploadFormProps {
  file: File | null;
  setFile: (file: File | null) => void;
  jobDescription: string;
  setJobDescription: (description: string) => void;
  isScoring: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onSubmit: (e: FormEvent) => void;
  submitButtonText?: string;
  submitButtonIcon?: React.ReactNode;
}

export default function ResumeUploadForm({
  file,
  setFile,
  jobDescription,
  setJobDescription,
  isScoring,
  fileInputRef,
  onSubmit,
  submitButtonText = "Score Resume",
  submitButtonIcon,
}: ResumeUploadFormProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
      {/* File Upload - Mobile Optimized */}
      <div>
        <label htmlFor="resume" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
          Upload Resume
        </label>
        <input
          id="resume"
          type="file"
          accept=".pdf,.doc,.docx,.odt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.text"
          onChange={e => setFile(e.target.files?.[0] || null)}
          ref={fileInputRef}
          className="block w-full text-black text-xs sm:text-sm text-gray-500 file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border rounded-md"
        />
      </div>
      
      {/* Job Description - Mobile Optimized */}
      <div className="relative">
        <label htmlFor="jobDescription" className="block text-sm sm:text-base font-medium text-gray-800 mb-1 sm:mb-2">
          Job Description
        </label>
        <div className="relative">
          <textarea
            id="jobDescription"
            placeholder="Paste job description here..."
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            rows={5}
            className="block w-full rounded-md border-2 border-blue-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs sm:text-sm p-2 sm:p-3 bg-blue-50/30 text-gray-900 placeholder-gray-400 resize-none"
            style={{ fontFamily: 'inherit' }}
          />
          {!jobDescription && !isFocused && (
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-start p-2 sm:p-3 text-xs sm:text-sm">
              <div className="bg-white/90 rounded-md p-2 sm:p-3 border border-blue-100 shadow-sm">
                <p className="font-medium text-blue-600 mb-1 sm:mb-2 flex items-center text-xs sm:text-sm">
                  💼 Enter Job Description
                </p>
                <p className="text-gray-600 mb-1 sm:mb-2 text-xs sm:text-sm">For best results, include:</p>
                <ul className="list-disc pl-4 sm:pl-5 text-xs space-y-0.5 sm:space-y-1 text-gray-500">
                  <li>Job title & required skills</li>
                  <li>Responsibilities & qualifications</li>
                  <li>Company details</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Submit Button - Mobile Optimized */}
      <button
        type="submit"
        disabled={isScoring || !file || !jobDescription}
        className="w-full flex justify-center items-center py-2.5 sm:py-3 px-3 sm:px-4 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
      >
        {isScoring ? (
          <>
            <div className="h-4 w-4 mr-1 sm:mr-2 bg-white/30 rounded animate-pulse"></div>
            <span className="hidden sm:inline">Processing...</span>
            <span className="sm:hidden">Processing</span>
          </>
        ) : (
          <>
            {submitButtonIcon}
            <span className="truncate">{submitButtonText}</span>
          </>
        )}
      </button>
    </form>
  );
} 