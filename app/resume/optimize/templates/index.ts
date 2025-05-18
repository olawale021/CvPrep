import jsPDF from 'jspdf';
import { ResumeTemplate } from '../hooks/usePdfGenerator';
import { ResumeData, ResumeResponse } from "../types";
import { generateClassicTemplate } from './classicTemplate';
import { generateModernTemplate } from './modernTemplate';

// Template registry - mapping template names to their generator functions
const templateRegistry: Record<ResumeTemplate, (resumeData: ResumeData, resumeResponse: ResumeResponse | null) => Promise<jsPDF>> = {
  classic: generateClassicTemplate,
  modern: generateModernTemplate
};

/**
 * Generate a PDF based on the selected template
 */
export const generatePdf = async (
  resumeData: ResumeData, 
  resumeResponse: ResumeResponse | null, 
  template: ResumeTemplate = "classic"
): Promise<jsPDF | null> => {
  if (!resumeData) return null;
  
  try {
    // Get the appropriate template generator function
    const templateGenerator = templateRegistry[template];
    if (!templateGenerator) {
      console.error(`Template "${template}" not found`);
      return null;
    }
    
    // Generate the PDF using the selected template
    return await templateGenerator(resumeData, resumeResponse);
  } catch (error) {
    console.error("Error generating PDF:", error);
    return null;
  }
}; 