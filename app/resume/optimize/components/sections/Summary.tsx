import { Edit } from "lucide-react";
import React, { useState } from "react";
import { Textarea } from "../../../../../components/ui/base/Textarea";
import { useResumeEdit } from "../../context/ResumeEditContext";

interface SummaryProps {
  summary?: string;
  isEditMode?: boolean;
}

export default function Summary({ summary, isEditMode = false }: SummaryProps) {
  const { editableResume, updateResumeField } = useResumeEdit();
  const [isEditing, setIsEditing] = useState(false);
  
  React.useEffect(() => {
    
    
    if (summary && !editableResume.summary) {
      updateResumeField('summary', summary);
    }
  }, [summary, editableResume.summary, updateResumeField, isEditMode]);

  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateResumeField('summary', e.target.value);
  };

  React.useEffect(() => {
    // Reset editing state when isEditMode changes
    if (!isEditMode) {
      setIsEditing(false);
    }
  }, [isEditMode]);

  // Set editing to true automatically when clicked while in edit mode
  const handleSummaryFocus = () => {
    if (isEditMode && !isEditing) {
      setIsEditing(true);
    }
  };

  return (
    <div className={`space-y-3 ${isEditMode && isEditing ? 'p-4 border border-blue-200 rounded-md bg-blue-50/30' : ''}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Professional Summary</h3>
        {isEditMode && isEditing && (
          <div className="text-xs text-blue-700 flex items-center">
            <Edit className="h-3 w-3 mr-1" />
            Editing
          </div>
        )}
      </div>
      
      {isEditMode && isEditing && (
        <div className="text-sm text-blue-700 mb-2">
          Write a concise overview of your professional background and key strengths.
        </div>
      )}
      
      <Textarea 
        className={`min-h-[120px] text-base text-black ${
          isEditMode ? 'border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50' : 
          'bg-transparent border-transparent'
        }`}
        value={editableResume.summary || ''}
        onChange={handleSummaryChange}
        onFocus={handleSummaryFocus}
        placeholder="Your professional summary..."
        readOnly={!isEditMode}
      />
      
      {(!isEditMode || !isEditing) && (
        <p className="text-sm text-gray-600">
          A concise overview of your professional background and key strengths.
        </p>
      )}
    </div>
  );
} 