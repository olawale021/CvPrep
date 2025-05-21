import React from "react";
import { Alert, AlertDescription, AlertTitle } from "./Alert";
import { Label } from "./Label";
import { Textarea } from "./Textarea";

interface JobDescriptionInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  maxLength?: number;
  error?: string | null;
}

export const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({ value, onChange, maxLength = 2000, error }) => (
  <div className="space-y-3">
    <Label htmlFor="job-description">Paste Job Description</Label>
    <Textarea
      id="job-description"
      placeholder="e.g. We are looking for a Frontend Developer with experience in React, TypeScript, and UI/UX best practices..."
      className="min-h-[180px]"
      value={value}
      onChange={onChange}
      maxLength={maxLength}
    />
    <div className="flex justify-between text-xs text-gray-500">
      <span>Max {maxLength} characters</span>
      <span>{value.length} / {maxLength}</span>
    </div>
    {error && (
      <Alert className="bg-red-50 border-red-200 mt-2">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="text-red-700">{error}</AlertDescription>
      </Alert>
    )}
  </div>
); 