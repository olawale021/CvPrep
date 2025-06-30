"use client";

import { MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Button } from "../../ui/base/Button";
import { Label } from "../../ui/base/Label";
import { Textarea } from "../../ui/base/Textarea";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../../ui/composite/Dialog";
import { useToast } from "../../ui/feedback/use-toast";

type FeedbackType = "bug" | "feature" | "improvement" | "other";
type FeedbackPriority = "low" | "medium" | "high";

interface FeedbackData {
  type: FeedbackType;
  priority: FeedbackPriority;
  title: string;
  description: string;
  userAgent: string;
  url: string;
  userId?: string;
  userEmail?: string;
}

export default function FeedbackWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<FeedbackData>>({
    type: "bug",
    priority: "medium",
    title: "",
    description: "",
  });

  const feedbackTypes = [
    { value: "bug", label: "🐛 Bug Report", description: "Something isn't working as expected" },
    { value: "feature", label: "💡 Feature Request", description: "Suggest a new feature" },
    { value: "improvement", label: "⚡ Improvement", description: "Suggest an enhancement" },
    { value: "other", label: "💬 Other", description: "General feedback or question" },
  ];

  const priorityLevels = [
    { value: "low", label: "Low", color: "bg-green-100 text-green-800 border-green-200" },
    { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    { value: "high", label: "High", color: "bg-red-100 text-red-800 border-red-200" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title?.trim() || !formData.description?.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both title and description.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const feedbackPayload: FeedbackData = {
      type: formData.type as FeedbackType,
      priority: formData.priority as FeedbackPriority,
      title: formData.title.trim(),
      description: formData.description.trim(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: user?.id,
      userEmail: user?.email,
    };

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedbackPayload),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      toast({
        title: "Feedback Submitted! 🎉",
        description: "Thank you for helping us improve CvPrep. We'll review your feedback soon.",
      });

      // Reset form
      setFormData({
        type: "bug",
        priority: "medium",
        title: "",
        description: "",
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Feedback submission error:", error);
      toast({
        title: "Submission Failed",
        description: "Unable to submit feedback. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = feedbackTypes.find(type => type.value === formData.type);

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-slate-800 hover:bg-slate-700 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group"
        aria-label="Send Feedback"
      >
        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 group-hover:rotate-12 transition-transform duration-300" />
        <span className="absolute -top-1 -left-1 sm:-top-2 sm:-left-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-bold animate-pulse">
          !
        </span>
      </button>

      {/* Feedback Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Help Us Improve CvPrep
          </DialogTitle>
          <DialogDescription className="text-gray-600 mb-4 sm:mb-6">
            Your feedback helps us build a better experience. Report bugs, suggest features, or share your thoughts.
          </DialogDescription>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Feedback Type Selection */}
            <div>
              <Label className="text-sm font-semibold text-gray-900 mb-3 block">
                What type of feedback do you have?
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {feedbackTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value as FeedbackType })}
                    className={`p-3 sm:p-4 rounded-xl border-2 text-left transition-all duration-200 hover:scale-105 ${
                      formData.type === type.value
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{type.label}</div>
                    <div className="text-xs sm:text-sm text-gray-600">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Selection */}
            <div>
              <Label className="text-sm font-semibold text-gray-900 mb-3 block">
                Priority Level
              </Label>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {priorityLevels.map((priority) => (
                  <button
                    key={priority.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: priority.value as FeedbackPriority })}
                    className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg border-2 font-medium transition-all duration-200 text-sm ${
                      formData.priority === priority.value
                        ? `${priority.color} scale-110 shadow-md`
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {priority.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title Input */}
            <div>
              <Label htmlFor="feedback-title" className="text-sm font-semibold text-gray-900 mb-2 block">
                {selectedType?.label.split(" ")[1]} Title
              </Label>
              <input
                id="feedback-title"
                type="text"
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={`Brief summary of your ${formData.type}`}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                maxLength={100}
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.title?.length || 0}/100 characters
              </div>
            </div>

            {/* Description Input */}
            <div>
              <Label htmlFor="feedback-description" className="text-sm font-semibold text-gray-900 mb-2 block">
                Detailed Description
              </Label>
              <Textarea
                id="feedback-description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={`Provide detailed information about your ${formData.type}. Include steps to reproduce if it's a bug.`}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[100px] sm:min-h-[120px] resize-none text-sm sm:text-base"
                maxLength={1000}
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.description?.length || 0}/1000 characters
              </div>
            </div>

            {/* User Info Display */}
            {user && (
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border">
                <div className="text-sm font-medium text-gray-700 mb-2">Submission Details:</div>
                <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                  <div>📧 {user.email}</div>
                  <div>🌐 {window.location.pathname}</div>
                  <div>🕒 {new Date().toLocaleString()}</div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.title?.trim() || !formData.description?.trim()}
                className="bg-slate-800 hover:bg-slate-700 w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 bg-white/30 rounded animate-pulse mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}