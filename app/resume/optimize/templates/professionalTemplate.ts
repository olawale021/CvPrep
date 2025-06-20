import jsPDF from "jspdf";
import { ResumeData, ResumeResponse } from "../types";

/**
 * Generates a professional style resume PDF with clean formatting
 */
export const generateProfessionalTemplate = async (resumeData: ResumeData, resumeResponse: ResumeResponse | null) => {
  // Extract contact details from resumeData first, then fall back to resumeResponse
  const contactDetails = resumeData.contact_details || 
                         resumeResponse?.contact_details || 
                         resumeResponse?.data?.contact_details || 
                         {};
  const userName = contactDetails.name || "";
  const userEmail = contactDetails.email || "";
  const contactDetailsExtended = contactDetails as typeof contactDetails & { phone_number?: string; phone?: string };
  const userPhone = contactDetailsExtended.phone_number || contactDetailsExtended.phone || "";
  const userLocation = contactDetails.location || "";
  
  // Try to extract contact info from optimized_text if structured data is missing
  let extractedName = "";
  let extractedEmail = "";
  let extractedPhone = "";
  let extractedLocation = "";
  
  const resumeDataWithText = resumeData as ResumeData & { optimized_text?: string };
  if (resumeDataWithText.optimized_text && (!userName || !userEmail)) {
    const text = resumeDataWithText.optimized_text;
    
    // Extract name (first line in bold)
    const nameMatch = text.match(/\*\*(.*?)\*\*/);
    if (nameMatch) {
      extractedName = nameMatch[1].trim();
    }
    
    // Extract email
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      extractedEmail = emailMatch[1];
    }
    
    // Extract phone (UK format or general format)
    const phoneMatch = text.match(/(\+?\d{2,3}[\s-]?\d{3,4}[\s-]?\d{3,4}[\s-]?\d{3,4}|\d{5}\s?\d{6})/);
    if (phoneMatch) {
      extractedPhone = phoneMatch[1];
    }
    
    // Extract location (between name and email, before |)
    const locationMatch = text.match(/\*\*.*?\*\*\s*\n(.*?)\s*\|/);
    if (locationMatch) {
      extractedLocation = locationMatch[1].trim();
    }
  }
  
  // Create PDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Use a professional font
  const mainFont = 'helvetica';
  
  // Page settings
  const margin = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;
  let currentPage = 1;
  
  // Page break function
  const addPageBreak = () => {
    pdf.addPage();
    currentPage++;
    yPos = margin + 5;
    
    // Add page number
    pdf.setFontSize(9);
    pdf.setTextColor(120, 120, 120);
    pdf.setFont(mainFont, 'normal');
    pdf.text(`Page ${currentPage}`, pageWidth - margin - 15, pageHeight - 10);
  };
  
  // Check if we need page break
  const checkPageBreak = (spaceNeeded: number) => {
    const availableSpace = pageHeight - yPos - 25; // 25mm buffer for footer
    
    if (spaceNeeded > availableSpace) {
      addPageBreak();
      return true;
    }
    return false;
  };
  
  // Count sections for better layout decisions
  const hasSkills = resumeData.skills && Object.keys(resumeData.skills).length > 0;
  const hasWorkExperience = resumeData.work_experience && resumeData.work_experience.length > 0;
  const hasProjects = resumeData.projects && resumeData.projects.length > 0;
  const hasCertifications = resumeData.certifications && resumeData.certifications.length > 0;
  const hasEducation = resumeData.education && resumeData.education.length > 0;
  
  // HEADER SECTION
  // Name - Large, centered
  pdf.setFontSize(22);
  pdf.setTextColor(30, 30, 30);
  pdf.setFont(mainFont, 'bold');
  
  const displayName = extractedName || 
                     userName || 
                     (resumeData.contact_details?.name) || 
                     "Professional Resume";
  
  pdf.text(displayName, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 6;
  
  // Contact details - single line, centered
  pdf.setFontSize(10);
  pdf.setTextColor(80, 80, 80);
  pdf.setFont(mainFont, 'normal');
  
  const contactParts = [];
  const email = extractedEmail || userEmail || resumeData.contact_details?.email || "";
  const phone = extractedPhone || userPhone || resumeData.contact_details?.phone || "";
  const location = extractedLocation || userLocation || resumeData.contact_details?.location || "";
  
  if (location) contactParts.push(location.replace(/\n/g, ' ').trim());
  if (email) contactParts.push(email);
  if (phone) contactParts.push(phone);
  
  if (contactParts.length > 0) {
    const contactText = contactParts.join(' | ');
    pdf.text(contactText, pageWidth / 2, yPos, { align: 'center' });
  }
  
  yPos += 6;
  
  // SUMMARY SECTION
  if (resumeData.summary) {
    checkPageBreak(25);
    
    pdf.setFontSize(14);
    pdf.setTextColor(30, 30, 30);
    pdf.setFont(mainFont, 'bold');
    pdf.text("PROFESSIONAL SUMMARY", margin, yPos);
    
    yPos += 2;
    
    // Horizontal line
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    
    yPos += 4;
    
    pdf.setFontSize(10);
    pdf.setTextColor(50, 50, 50);
    pdf.setFont(mainFont, 'normal');
    
    const summaryLines = pdf.splitTextToSize(resumeData.summary, contentWidth);
    pdf.text(summaryLines, margin, yPos);
    yPos += summaryLines.length * 4;
    
    yPos += 6;
  }
  
  // SKILLS SECTION
  if (hasSkills) {
    checkPageBreak(30);
    
    pdf.setFontSize(14);
    pdf.setTextColor(30, 30, 30);
    pdf.setFont(mainFont, 'bold');
    pdf.text("SKILLS", margin, yPos);
    
    yPos += 2;
    
    // Horizontal line
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    
    yPos += 5;
    
    pdf.setFontSize(10);
    pdf.setTextColor(50, 50, 50);
    pdf.setFont(mainFont, 'normal');
    
    Object.entries(resumeData.skills || {}).forEach(([category, skillList]) => {
      if (!skillList || !skillList.length) return;
      
      const formattedCategory = category
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Create bullet point with category and skills
      pdf.text("•", margin, yPos);
      
      if (Array.isArray(skillList) && skillList.length > 0) {
        const validSkills = skillList.filter(skill => skill && typeof skill === 'string');
        if (validSkills.length > 0) {
          const skillText = `${formattedCategory} (${validSkills.join(', ')})`;
          const skillLines = pdf.splitTextToSize(skillText, contentWidth - 8);
          pdf.text(skillLines, margin + 4, yPos);
          yPos += skillLines.length * 4;
        }
      }
      
      yPos += 1;
    });
    
    yPos += 5;
  }
  
  // WORK EXPERIENCE SECTION
  if (hasWorkExperience) {
    checkPageBreak(40);
    
    pdf.setFontSize(14);
    pdf.setTextColor(30, 30, 30);
    pdf.setFont(mainFont, 'bold');
    pdf.text("PROFESSIONAL EXPERIENCE", margin, yPos);
    
    yPos += 2;
    
    // Horizontal line
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    
    yPos += 5;
    
    (resumeData.work_experience || []).forEach((exp, index) => {
      const bulletPoints = exp.bullets || exp.accomplishments || [];
      const estimatedHeight = 20 + (bulletPoints.length * 12);
      
      checkPageBreak(estimatedHeight);
      
      // Company name
      pdf.setFontSize(12);
      pdf.setTextColor(30, 30, 30);
      pdf.setFont(mainFont, 'bold');
      if (exp.company) {
        const companyText = exp.location ? `${exp.company} (${exp.location})` : exp.company;
        pdf.text(companyText, margin, yPos);
      }
      
      // Date on the right
      const dateText = exp.dates || exp.date_range || "";
      if (dateText) {
        const dateWidth = pdf.getTextWidth(dateText);
        pdf.setFontSize(11);
        pdf.setFont(mainFont, 'normal');
        pdf.text(dateText, pageWidth - margin - dateWidth, yPos);
      }
      
      yPos += 5;
      
      // Job title
      pdf.setFontSize(11);
      pdf.setTextColor(50, 50, 50);
      pdf.setFont(mainFont, 'italic');
      if (exp.title || exp.role) {
        pdf.text(exp.title || exp.role || "Position", margin, yPos);
      }
      
      yPos += 5;
      
      // Bullet points
      if (bulletPoints.length > 0) {
        pdf.setFontSize(10);
        pdf.setTextColor(50, 50, 50);
        pdf.setFont(mainFont, 'normal');
        
        bulletPoints.forEach((bullet) => {
          if (!bullet) return;
          
          const bulletLines = pdf.splitTextToSize(String(bullet), contentWidth - 8);
          const bulletHeight = bulletLines.length * 4 + 2;
          
          if (yPos + bulletHeight > pageHeight - 25) {
            addPageBreak();
          }
          
          pdf.text("•", margin, yPos);
          
          if (bulletLines && bulletLines.length > 0) {
            pdf.text(bulletLines, margin + 4, yPos);
            yPos += bulletLines.length * 4;
          }
          
          yPos += 1;
        });
      }
      
      // Add space between experiences
      if (index < (resumeData.work_experience?.length || 0) - 1) {
        yPos += 4;
      }
    });
    
    yPos += 6;
  }
  
  // PROJECTS SECTION
  if (hasProjects) {
    checkPageBreak(30);
    
    pdf.setFontSize(14);
    pdf.setTextColor(30, 30, 30);
    pdf.setFont(mainFont, 'bold');
    pdf.text("PERSONAL PROJECTS", margin, yPos);
    
    yPos += 2;
    
    // Horizontal line
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    
    yPos += 8;
    
    (resumeData.projects || []).forEach((project, index) => {
      const estimatedHeight = 25;
      checkPageBreak(estimatedHeight);
      
      // Project title
      pdf.setFontSize(11);
      pdf.setTextColor(30, 30, 30);
      pdf.setFont(mainFont, 'bold');
      if (project.title) {
        pdf.text(project.title || "Project", margin, yPos);
      }
      
      yPos += 5;
      
      // Project description
      pdf.setFontSize(10);
      pdf.setTextColor(50, 50, 50);
      pdf.setFont(mainFont, 'normal');
      
      if (project.description) {
        const descLines = pdf.splitTextToSize(project.description, contentWidth);
        pdf.text(descLines, margin, yPos);
        yPos += descLines.length * 4;
      }
      
      // Technologies
      if (project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0) {
        yPos += 2;
        pdf.setFontSize(9);
        pdf.setTextColor(80, 80, 80);
        pdf.setFont(mainFont, 'italic');
        
        const validTechs = project.technologies.filter(tech => tech && typeof tech === 'string');
        if (validTechs.length > 0) {
          const techText = "Technologies: " + validTechs.join(', ');
          const techLines = pdf.splitTextToSize(techText, contentWidth);
          pdf.text(techLines, margin, yPos);
          yPos += techLines.length * 3;
        }
      }
      
      // Space between projects
      if (index < (resumeData.projects?.length || 0) - 1) {
        yPos += 6;
      }
    });
    
    yPos += 8;
  }
  
  // EDUCATION SECTION
  if (hasEducation) {
    checkPageBreak(25);
    
    pdf.setFontSize(14);
    pdf.setTextColor(30, 30, 30);
    pdf.setFont(mainFont, 'bold');
    pdf.text("EDUCATION", margin, yPos);
    
    yPos += 2;
    
    // Horizontal line
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    
    yPos += 8;
    
    (resumeData.education || []).forEach((edu, index) => {
      checkPageBreak(15);
      
      // University/School name
      pdf.setFontSize(12);
      pdf.setTextColor(30, 30, 30);
      pdf.setFont(mainFont, 'bold');
      if (edu.school) {
        pdf.text(edu.school || "Institution", margin, yPos);
      }
      
      // Location on the right
      if (edu.location) {
        const locationWidth = pdf.getTextWidth(edu.location);
        pdf.setFontSize(10);
        pdf.setFont(mainFont, 'normal');
        pdf.text(edu.location, pageWidth - margin - locationWidth, yPos);
      }
      
      yPos += 5;
      
      // Degree
      pdf.setFontSize(11);
      pdf.setTextColor(50, 50, 50);
      pdf.setFont(mainFont, 'normal');
      if (edu.degree) {
        pdf.text(edu.degree, margin, yPos);
      }
      
      yPos += 6;
      
      // Space between education entries
      if (index < (resumeData.education?.length || 0) - 1) {
        yPos += 4;
      }
    });
    
    yPos += 8;
  }
  
  // CERTIFICATIONS SECTION
  if (hasCertifications) {
    checkPageBreak(20);
    
    pdf.setFontSize(14);
    pdf.setTextColor(30, 30, 30);
    pdf.setFont(mainFont, 'bold');
    pdf.text("PROFESSIONAL CERTIFICATE", margin, yPos);
    
    yPos += 2;
    
    // Horizontal line
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    
    yPos += 8;
    
    pdf.setFontSize(10);
    pdf.setTextColor(50, 50, 50);
    pdf.setFont(mainFont, 'normal');
    
    (resumeData.certifications || []).forEach((cert) => {
      if (!cert || typeof cert !== 'string') return;
      
      checkPageBreak(8);
      
      pdf.text("•", margin, yPos);
      
      const lines = pdf.splitTextToSize(cert, contentWidth - 8);
      if (lines && lines.length > 0) {
        pdf.text(lines, margin + 4, yPos);
        yPos += lines.length * 4;
      }
      
      yPos += 2;
    });
  }
  
  // Add footer to all pages
  for (let page = 1; page <= currentPage; page++) {
    if (page > 1) {
      pdf.setPage(page);
    }
    
    // Footer with generation date and page number
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.setFont(mainFont, 'italic');
    
    const currentDate = new Date().toLocaleDateString();
    const footerText = `Resume generated on ${currentDate} · CvPrep.ai`;
    
    pdf.text(footerText, margin, pageHeight - 10);
    
    if (currentPage > 1) {
      pdf.text(`Page ${page} of ${currentPage}`, pageWidth - margin - 20, pageHeight - 10);
    }
  }
  
  return pdf;
}; 