import { AlertCircle, CheckCircle2, FileText, Sparkles, Upload, X } from "lucide-react";
import { FormEvent, RefObject, useCallback, useState } from "react";

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
  submitButtonText = "Analyze & Score Resume",
  submitButtonIcon,
}: ResumeUploadFormProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);

  const minJobDescLength = 50;
  const maxJobDescLength = 3000;

  const validateFile = useCallback((file: File): string | null => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(extension)) {
      return 'Please upload a PDF, DOC, or DOCX file';
    }
    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }
    return null;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragError(null);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const droppedFile = files[0];
      const error = validateFile(droppedFile);
      if (error) {
        setDragError(error);
        return;
      }
      setFile(droppedFile);
      setDragError(null);
    }
  }, [setFile, validateFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const error = validateFile(selectedFile);
      if (error) {
        setDragError(error);
        return;
      }
      setFile(selectedFile);
      setDragError(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setDragError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isFormValid = file && jobDescription.length >= minJobDescLength;
  const jobDescProgress = Math.min((jobDescription.length / minJobDescLength) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Header with progress indicator */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Sparkles className="h-5 w-5 text-blue-500 mr-2" />
          Resume Analysis
        </h2>
        <div className="flex space-x-1">
          <div className={`w-2 h-2 rounded-full ${file ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <div className={`w-2 h-2 rounded-full ${jobDescription.length >= minJobDescLength ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <div className={`w-2 h-2 rounded-full ${isFormValid ? 'bg-green-500' : 'bg-gray-300'}`}></div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Enhanced File Upload with Drag & Drop */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Upload Resume
            <span className="text-red-500 ml-1">*</span>
          </label>
          
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg transition-all duration-200 ${
              isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : file 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400'
            } ${dragError ? 'border-red-300 bg-red-50' : ''}`}
          >
            {!file ? (
              <div className="p-6 text-center">
                <Upload className={`mx-auto h-8 w-8 mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                <p className="text-sm text-gray-600 mb-2">
                  {isDragging ? 'Drop your resume here' : 'Drag & drop your resume, or'}
                </p>
                <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 transition-colors">
                  Browse Files
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-400 mt-2">
                  PDF, DOC, DOCX up to 10MB
                </p>
              </div>
            ) : (
              <div className="p-4 flex items-center justify-between bg-white rounded-lg border border-green-200 m-2">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            )}
          </div>

          {dragError && (
            <div className="flex items-center text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              {dragError}
            </div>
          )}
        </div>

        {/* Enhanced Job Description */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Job Description
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="flex items-center space-x-2">
              <div className={`text-xs ${
                jobDescription.length < minJobDescLength 
                  ? 'text-red-500' 
                  : jobDescription.length > maxJobDescLength 
                    ? 'text-orange-500' 
                    : 'text-green-500'
              }`}>
                {jobDescription.length}/{maxJobDescLength}
              </div>
              {jobDescription.length >= minJobDescLength && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className={`h-1 rounded-full transition-all duration-300 ${
                jobDescProgress === 100 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(jobDescProgress, 100)}%` }}
            ></div>
          </div>

          <div className="relative">
            <textarea
              id="jobDescription"
              placeholder="Paste the complete job description here..."
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              maxLength={maxJobDescLength}
              rows={6}
              className={`block w-full rounded-lg border-2 shadow-sm text-sm p-4 bg-gray-50 text-gray-900 placeholder-gray-500 resize-none transition-all duration-200 ${
                isFocused 
                  ? 'border-blue-500 bg-white ring-1 ring-blue-500' 
                  : jobDescription.length >= minJobDescLength 
                    ? 'border-green-300 bg-green-50/30' 
                    : 'border-gray-300 hover:border-gray-400'
              }`}
            />
            
            {!jobDescription && !isFocused && (
              <div className="absolute inset-4 pointer-events-none">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100 shadow-sm">
                  <p className="font-medium text-blue-700 mb-2 flex items-center text-sm">
                    💼 Paste Job Description
                  </p>
                  <p className="text-gray-600 mb-2 text-sm">Include these for best results:</p>
                  <ul className="list-disc pl-5 text-sm space-y-1 text-gray-600">
                    <li>Job title & required skills</li>
                    <li>Responsibilities & qualifications</li>
                    <li>Preferred experience & education</li>
                    <li>Company information</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {jobDescription.length > 0 && jobDescription.length < minJobDescLength && (
            <p className="text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              Please add at least {minJobDescLength - jobDescription.length} more characters for better analysis
            </p>
          )}
        </div>

        {/* Enhanced Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isScoring || !isFormValid}
            className={`w-full relative overflow-hidden flex justify-center items-center py-4 px-6 border border-transparent rounded-lg shadow-lg text-sm font-semibold transition-all duration-200 transform ${
              isFormValid && !isScoring
                ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-[1.02] hover:shadow-xl' 
                : 'text-gray-500 bg-gray-200 cursor-not-allowed'
            }`}
          >
            {isScoring ? (
              <>
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-3"></div>
                  <span>Analyzing Resume...</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-300">
                  <div className="h-full bg-blue-500 animate-pulse"></div>
                </div>
              </>
            ) : (
              <>
                {submitButtonIcon || <Sparkles className="h-4 w-4 mr-2" />}
                <span>{submitButtonText}</span>
              </>
            )}
          </button>

          {!isFormValid && (
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-500">
                {!file && !jobDescription ? 'Upload a resume and add job description to continue' :
                 !file ? 'Please upload your resume' :
                 jobDescription.length < minJobDescLength ? `Add ${minJobDescLength - jobDescription.length} more characters to job description` :
                 'Ready to analyze!'}
              </p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
} 