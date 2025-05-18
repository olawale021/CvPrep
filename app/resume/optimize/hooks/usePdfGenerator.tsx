import { useState } from "react";
import { generatePdf } from "../templates";
import { ResumeData, ResumeResponse } from "../types";

// Type definition for available templates
export type ResumeTemplate = "classic" | "modern";

/**
 * Hook for PDF generation functionality
 */
export function usePdfGenerator() {
  const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>("classic");

  /**
   * Generate a PDF based on the selected template
   */
  const generatePdfDocument = async (resumeData: ResumeData, resumeResponse: ResumeResponse | null, template: ResumeTemplate = "classic") => {
    if (!resumeData) return null; // Return null if no data
    
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
      console.log("Generated PDF preview URL:", url);
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