import { Crown, Loader2, Save, Star } from 'lucide-react';
import React, { useState } from 'react';
import { GeneratedResumeData, SaveResumeRequest, SavedResumeFormData } from '../../../types/api/savedResume';
import { Button } from '../../ui/base/Button';
import { Checkbox } from '../../ui/base/Checkbox';
import { Input } from '../../ui/base/Input';
import { Label } from '../../ui/base/Label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/composite/Dialog';

interface SaveResumeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (request: SaveResumeRequest) => Promise<{ success: boolean; error?: string }>;
  onSuccess?: () => void;
  defaultTitle?: string;
  isSaving?: boolean;
}

export function SaveResumeDialog({
  isOpen,
  onClose,
  onSave,
  onSuccess,
  defaultTitle = '',
  isSaving = false
}: SaveResumeDialogProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [isPrimary, setIsPrimary] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setTitle(defaultTitle);
      setIsPrimary(false);
      setIsFavorite(false);
      setError(null);
    }
  }, [isOpen, defaultTitle]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Please enter a title for your resume');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Note: The actual formData and generatedData will be passed from the parent component
      // This is just the dialog interface - the parent will handle the actual data
      const emptyFormData: SavedResumeFormData = {
        jobDescription: '',
        currentSummary: '',
        workExperience: [],
        education: [],
        projects: [],
        certifications: '',
        licenses: ''
      };

      const emptyGeneratedData: GeneratedResumeData = {
        summary: '',
        skills: {
          technical_skills: [],
          soft_skills: []
        },
        work_experience: [],
        education: [],
        projects: [],
        certifications: []
      };

      const result = await onSave({
        title: title.trim(),
        formData: emptyFormData, // Will be provided by parent
        generatedData: emptyGeneratedData, // Will be provided by parent
        isPrimary,
        isFavorite
      });

      if (result.success) {
        onClose();
        // Reset form
        setTitle('');
        setIsPrimary(false);
        setIsFavorite(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(result.error || 'Failed to save resume');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Save resume error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !isSaving) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-blue-600" />
            Save Resume
          </DialogTitle>
          <DialogDescription>
            Save your generated resume for easy access later. You can download it again anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="resume-title">Resume Title *</Label>
            <Input
              id="resume-title"
              placeholder="e.g., Software Engineer - Google, Marketing Manager Resume"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting || isSaving}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Give your resume a descriptive name to easily find it later
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="set-primary"
                checked={isPrimary}
                onCheckedChange={(checked: boolean) => setIsPrimary(checked)}
                disabled={isSubmitting || isSaving}
              />
              <Label 
                htmlFor="set-primary" 
                className="flex items-center gap-2 text-sm font-normal cursor-pointer"
              >
                <Crown className="h-4 w-4 text-yellow-600" />
                Set as primary resume
              </Label>
            </div>
            <p className="text-xs text-gray-500 ml-6">
              Your primary resume will be highlighted in your saved resumes list
            </p>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="add-favorite"
                checked={isFavorite}
                onCheckedChange={(checked: boolean) => setIsFavorite(checked)}
                disabled={isSubmitting || isSaving}
              />
              <Label 
                htmlFor="add-favorite" 
                className="flex items-center gap-2 text-sm font-normal cursor-pointer"
              >
                <Star className="h-4 w-4 text-yellow-500" />
                Add to favorites
              </Label>
            </div>
            <p className="text-xs text-gray-500 ml-6">
              Favorite resumes appear at the top of your list for quick access
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting || isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || isSaving || !title.trim()}
            className="min-w-[100px]"
          >
            {isSubmitting || isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Resume
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 