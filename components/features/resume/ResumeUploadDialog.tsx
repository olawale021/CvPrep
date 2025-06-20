"use client";

import { AlertCircle, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { cn } from "../../../lib/core/utils";
import { uploadResume, validateResumeFile } from "../../../lib/services/resumeService";
// Simple toast implementation
const useToast = () => {
  const toast = (options: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
    duration?: number;
  }) => {
    // Create a simple toast notification
    const toastElement = document.createElement('div');
    toastElement.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
      options.variant === 'destructive' 
        ? 'bg-red-600 text-white' 
        : 'bg-green-600 text-white'
    }`;
    
    // Create title element safely
    const titleElement = document.createElement('div');
    titleElement.className = 'font-semibold';
    titleElement.textContent = options.title;
    toastElement.appendChild(titleElement);
    
    // Create description element safely if provided
    if (options.description) {
      const descriptionElement = document.createElement('div');
      descriptionElement.className = 'text-sm mt-1';
      descriptionElement.textContent = options.description;
      toastElement.appendChild(descriptionElement);
    }
    
    document.body.appendChild(toastElement);
    
    // Remove after duration
    setTimeout(() => {
      if (document.body.contains(toastElement)) {
        document.body.removeChild(toastElement);
      }
    }, options.duration || 3000);
  };
  
  return { toast };
};

interface ResumeUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ResumeUploadDialog({ open, onOpenChange, onSuccess }: ResumeUploadDialogProps) {
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isPrimary, setIsPrimary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validation = validateResumeFile(selectedFile);
      
      if (!validation.valid) {
        setValidationError(validation.error || "Invalid file");
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setValidationError(null);
        setFile(selectedFile);
        if (!title) {
          // Use filename as default title (without extension)
          const fileName = selectedFile.name.split(".").slice(0, -1).join(".");
          setTitle(fileName || "My Resume");
        }
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !user?.id) return;
    
    setIsUploading(true);
    try {
      const result = await uploadResume({
        file,
        userId: user.id,
        title: title || file.name,
        isPrimary,
      });

      if (result.success) {
        toast({
          title: "Resume uploaded",
          description: "Your resume has been uploaded successfully.",
          duration: 3000,
        });
        resetForm();
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: result.error || "Failed to upload resume. Please try again.",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setFile(null);
    setValidationError(null);
    setIsPrimary(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${open ? 'block' : 'hidden'}`}>
      <div className="bg-black/50 backdrop-blur-sm fixed inset-0" onClick={() => onOpenChange(false)}></div>
      <div className="sm:max-w-[500px] p-6 bg-white fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] rounded-lg shadow-xl">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Upload Resume</h2>
          <p className="text-gray-700 mt-2">
            Upload a resume file. Supported formats: PDF, DOC, DOCX, ODT.
          </p>
        </div>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="title" className="text-right text-gray-800 font-medium text-base">
              Title
            </label>
            <div className="col-span-3">
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-md bg-white text-gray-900 shadow-sm focus:border-blue-500 text-base h-11 px-3"
                placeholder="My Resume"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="resume" className="text-right text-gray-800 font-medium text-base">
              File
            </label>
            <div className="col-span-3">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                <input
                  id="resume"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.odt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.text"
                  className={cn(
                    "cursor-pointer text-gray-700 file:bg-blue-50 file:text-blue-700 file:border-0 file:rounded file:px-4 file:py-2 file:mr-4 file:hover:bg-blue-100 file:transition-colors",
                    validationError ? "text-red-500" : ""
                  )}
                />
                {validationError && (
                  <p className="text-red-500 text-sm mt-3 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {validationError}
                  </p>
                )}
                {file && (
                  <p className="text-gray-700 text-sm mt-3 flex items-center">
                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded mr-2">Selected:</span> 
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="text-right">
              <label htmlFor="primary" className="cursor-pointer text-gray-800 font-medium text-base">
                Primary
              </label>
            </div>
            <div className="col-span-3 flex items-center space-x-2">
              <input
                type="checkbox"
                id="primary"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              />
              <label htmlFor="primary" className="text-base text-gray-700">
                Set as primary resume
              </label>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button 
            onClick={() => onOpenChange(false)} 
            disabled={isUploading}
            className="px-5 py-2.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading || !title.trim()}
            className="px-5 py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 min-w-[100px] text-base flex items-center justify-center"
          >
            {isUploading ? (
              <>
                <div className="mr-2 h-5 w-5 bg-white/30 rounded animate-pulse" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 