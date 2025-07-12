import { Document } from 'docx';
import jsPDF from 'jspdf';
import { ResumeTemplate } from '../hooks/usePdfGenerator';
import { ResumeData, ResumeResponse } from "../types";
import { generateClassicTemplate } from './classicTemplate';
import { generateModernTemplate } from './modernTemplate';
import { generateProfessionalTemplate } from './professionalTemplate';

// Word template imports
import { generateClassicWordTemplate } from './wordTemplates/classicWordTemplate';
import { generateModernWordTemplate } from './wordTemplates/modernWordTemplate';
import { generateProfessionalWordTemplate } from './wordTemplates/professionalWordTemplate';

// PDF Template registry - mapping template names to their generator functions
const templateRegistry: Record<ResumeTemplate, (resumeData: ResumeData, resumeResponse: ResumeResponse | null) => Promise<jsPDF>> = {
  classic: generateClassicTemplate,
  modern: generateModernTemplate,
  professional: generateProfessionalTemplate
};

// Word Template registry - mapping template names to their generator functions
const wordTemplateRegistry: Record<ResumeTemplate, (resumeData: ResumeData, resumeResponse: ResumeResponse | null) => Document> = {
  classic: generateProfessionalWordTemplate,  // Classic should use professional styling
  modern: generateModernWordTemplate,
  professional: generateClassicWordTemplate  // Professional should use classic styling
};

/**
 * Generate a PDF based on the selected template
 */
export const generatePdf = async (
  resumeData: ResumeData, 
  resumeResponse: ResumeResponse | null, 
  template: ResumeTemplate = "classic"
): Promise<jsPDF | null> => {

  
  if (!resumeData) {
    console.error('generatePdf: No resume data provided');
    return null;
  }
  
  try {
    // Get the appropriate template generator function
    const templateGenerator = templateRegistry[template];
    if (!templateGenerator) {
      console.error(`Template "${template}" not found in registry`);
    
      return null;
    }
    
  
    // Generate the PDF using the selected template
    const result = await templateGenerator(resumeData, resumeResponse);
  
    return result;
  } catch (error) {
    console.error(`Error generating PDF with ${template} template:`, error);
    return null;
  }
};

/**
 * Generate a Word document based on the selected template
 */
export const generateWordDocument = (
  resumeData: ResumeData, 
  resumeResponse: ResumeResponse | null, 
  template: ResumeTemplate = "classic"
): Document | null => {

  
  if (!resumeData) {
    console.error('generateWordDocument: No resume data provided');
    return null;
  }
  
  try {
    // Get the appropriate template generator function
    const templateGenerator = wordTemplateRegistry[template];
    if (!templateGenerator) {
      console.error(`Word template "${template}" not found in registry`);
    
      return null;
    }
    
  
    // Generate the Word document using the selected template
    const result = templateGenerator(resumeData, resumeResponse);
  
    return result;
  } catch (error) {
    console.error(`Error generating Word document with ${template} template:`, error);
    return null;
  }
};

// Export individual template functions for direct use
export {
  generateClassicTemplate, generateClassicWordTemplate, generateModernTemplate, generateModernWordTemplate, generateProfessionalTemplate, generateProfessionalWordTemplate
};

