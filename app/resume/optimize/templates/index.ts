import jsPDF from 'jspdf';
import { ResumeTemplate } from '../hooks/usePdfGenerator';
import { ResumeData, ResumeResponse } from "../types";
import { generateClassicTemplate } from './classicTemplate';
import { generateModernTemplate } from './modernTemplate';
import { generateProfessionalTemplate } from './professionalTemplate';

// Template registry - mapping template names to their generator functions
const templateRegistry: Record<ResumeTemplate, (resumeData: ResumeData, resumeResponse: ResumeResponse | null) => Promise<jsPDF>> = {
  classic: generateClassicTemplate,
  modern: generateModernTemplate,
  professional: generateProfessionalTemplate
};

/**
 * Generate a PDF based on the selected template
 */
export const generatePdf = async (
  resumeData: ResumeData, 
  resumeResponse: ResumeResponse | null, 
  template: ResumeTemplate = "classic"
): Promise<jsPDF | null> => {
  console.log('generatePdf called with template:', template);
  
  if (!resumeData) {
    console.error('generatePdf: No resume data provided');
    return null;
  }
  
  try {
    // Get the appropriate template generator function
    const templateGenerator = templateRegistry[template];
    if (!templateGenerator) {
      console.error(`Template "${template}" not found in registry`);
      console.log('Available templates:', Object.keys(templateRegistry));
      return null;
    }
    
    console.log(`Calling ${template} template generator`);
    // Generate the PDF using the selected template
    const result = await templateGenerator(resumeData, resumeResponse);
    console.log(`${template} template generator completed:`, { success: !!result });
    return result;
  } catch (error) {
    console.error(`Error generating PDF with ${template} template:`, error);
    return null;
  }
}; 