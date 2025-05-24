import { FileText } from "lucide-react";
import React, { useRef } from "react";
import { Button } from "./Button";
import { Label } from "./Label";

interface ResumeUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  onRemoveFile: () => void;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({ file, onFileChange, onRemoveFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onFileChange(event.target.files[0]);
    }
  };

  return (
    <div>
      <Label htmlFor="resume-upload" className="mb-2 block text-black">Upload Resume</Label>
      <div
        className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-700 mb-1 font-medium">
            {file ? file.name : "Drop your resume here or click to browse"}
          </p>
          <p className="text-xs text-gray-500">
            Accepted formats: PDF, DOC, DOCX
          </p>
        </div>
      </div>
      <input
        id="resume-upload"
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileChange}
        className="hidden"
      />
      {file && (
        <Button
          variant="ghost"
          className="mt-2 text-xs text-red-500 hover:text-red-700"
          onClick={onRemoveFile}
        >
          Remove File
        </Button>
      )}
    </div>
  );
}; 