import { useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { generatePdf } from "../templates";
import { ResumeData, ResumeResponse } from "../types";
import { isTemplateAllowed } from "../utils/templateGuards";

// Type definition for available templates
export type ResumeTemplate = "classic" | "modern" | "professional";

/**
 * Hook for PDF generation functionality
 */
export function usePdfGenerator() {
  const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>("classic");
  const { appUser } = useAuth();
  const isPremium = appUser?.type === "premium";

  /**
   * Generate a PDF based on the selected template
   */
  const generatePdfDocument = async (resumeData: ResumeData, resumeResponse: ResumeResponse | null, template: ResumeTemplate = "classic") => {
    if (!resumeData) return null; // Return null if no data
    
    // Check if template is allowed for user's subscription
    if (!isTemplateAllowed(template, isPremium)) {
      setError("This template requires a premium subscription");
      throw new Error("Premium subscription required for this template");
    }
    
    try {
      setIsPdfGenerating(true);
      return await generatePdf(resumeData, resumeResponse, template);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Failed to generate PDF. Please try again.");
      return null;
    } finally {
      setIsPdfGenerating(false);
    }
  };

  /**
   * Generate a preview of the PDF
   */
  const generatePreview = async (resumeData: ResumeData, resumeResponse: ResumeResponse | null) => {
    if (!resumeData) return;
    
    // Check if template is allowed for user's subscription
    if (!isTemplateAllowed(selectedTemplate, isPremium)) {
      setError("This template requires a premium subscription");
      return;
    }
    
    try {
      setIsPdfGenerating(true);
      const pdf = await generatePdfDocument(resumeData, resumeResponse, selectedTemplate);
      if (!pdf) throw new Error("Failed to generate PDF");
      
      // Force PDF to be rendered with proper mime type
      const pdfBlob = pdf.output('blob', { type: 'application/pdf' });
      
      // First revoke any existing object URL to prevent memory leaks
      if (previewUrl) {
        try {
          URL.revokeObjectURL(previewUrl);
        } catch (e) {
          console.error("Error revoking previous URL:", e);
        }
      }
      
      // Create a new blob URL
      const url = URL.createObjectURL(pdfBlob);
  
      setPreviewUrl(url);
      return url;
    } catch (err) {
      setError('Failed to generate preview');
      console.error("PDF preview generation error:", err);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  /**
   * Download the PDF
   */
  const downloadPdf = async (resumeData: ResumeData, resumeResponse: ResumeResponse | null) => {
    if (!resumeData) return;
    
    // Check if template is allowed for user's subscription
    if (!isTemplateAllowed(selectedTemplate, isPremium)) {
      setError("This template requires a premium subscription");
      return;
    }
    
    try {
      setIsPdfGenerating(true);
      const pdf = await generatePdfDocument(resumeData, resumeResponse, selectedTemplate);
      if (!pdf) throw new Error("Failed to generate PDF");
      pdf.save('optimized-resume.pdf');
    } catch (err) {
      setError('Failed to download PDF');
      console.error(err);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  return {
    isPdfGenerating,
    setIsPdfGenerating,
    previewUrl,
    generatePreview,
    downloadPdf,
    error,
    selectedTemplate,
    setSelectedTemplate
  };
} 