import jsPDF from "jspdf";
import { ResumeData, ResumeResponse } from "../types";

/**
 * Generates a classic style resume PDF with multi-page support
 */
export const generateClassicTemplate = async (resumeData: ResumeData, resumeResponse: ResumeResponse | null) => {
  // Extract contact details from the full response
  const contactDetails = resumeResponse?.contact_details || 
                         resumeResponse?.data?.contact_details || 
                         {};
  const userName = contactDetails.name || "";
  const userEmail = contactDetails.email || "";
  const contactDetailsExtended = contactDetails as typeof contactDetails & { phone_number?: string; phone?: string };
  const userPhone = contactDetailsExtended.phone_number || contactDetailsExtended.phone || "";
  const userLocation = contactDetails.location || "";
  
  // Debug logging to understand the data structure
  // console.log("=== CLASSIC TEMPLATE DEBUG ===");
  // console.log("resumeResponse:", resumeResponse);
  // console.log("resumeResponse.data:", resumeResponse?.data);
  // console.log("resumeResponse.data.contact_details:", resumeResponse?.data?.contact_details);
  // console.log("contactDetails:", contactDetails);
  // console.log("userName:", userName);
  // console.log("resumeData:", resumeData);
  // console.log("resumeData.contact_details:", resumeData.contact_details);
  
  // Try to extract contact info from optimized_text if structured data is missing
  let extractedName = "";
  let extractedEmail = "";
  let extractedPhone = "";
  let extractedLocation = "";
  
  const resumeDataWithText = resumeData as ResumeData & { optimized_text?: string };
  if (resumeDataWithText.optimized_text && (!userName || !userEmail)) {
    const text = resumeDataWithText.optimized_text;
    // console.log("Extracting from optimized_text...");
    
    // Extract name (first line in bold)
    const nameMatch = text.match(/\*\*(.*?)\*\*/);
    if (nameMatch) {
      extractedName = nameMatch[1].trim();
      // console.log("Extracted name:", extractedName);
    }
    
    // Extract email
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      extractedEmail = emailMatch[1];
      // console.log("Extracted email:", extractedEmail);
    }
    
    // Extract phone (UK format or general format)
    const phoneMatch = text.match(/(\+?\d{2,3}[\s-]?\d{3,4}[\s-]?\d{3,4}[\s-]?\d{3,4}|\d{5}\s?\d{6})/);
    if (phoneMatch) {
      extractedPhone = phoneMatch[1];
      // console.log("Extracted phone:", extractedPhone);
    }
    
    // Extract location (between name and email, before |)
    const locationMatch = text.match(/\*\*.*?\*\*\s*\n(.*?)\s*\|/);
    if (locationMatch) {
      extractedLocation = locationMatch[1].trim();
      // console.log("Extracted location:", extractedLocation);
    }
  }
  
  // console.log("===============================");
  
  // Create PDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Use Times New Roman font
  const mainFont = 'times';
  
  // Page settings
  const margin = 15;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;
  let currentPage = 1;
  
  // Page break function
  const addPageBreak = () => {
    pdf.addPage();
    currentPage++;
    yPos = margin;
    
    // Add background color to new page
    pdf.setFillColor(252, 252, 253);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Add page number
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.setFont(mainFont, 'normal');
    pdf.text(`Page ${currentPage}`, pageWidth - margin - 10, pageHeight - 10);
  };
  
  // Check if we need page break
  const checkPageBreak = (spaceNeeded: number) => {
    // Leave more space for footer and ensure we don't cut off content
    const availableSpace = pageHeight - yPos - 20; // 20mm buffer for footer
    
    if (spaceNeeded > availableSpace) {
      addPageBreak();
      return true; // Indicate that a page break occurred
    }
    return false;
  };
  
  // Special function for work experience that might need to break mid-entry
  const checkWorkExperiencePageBreak = (exp: { bullets?: string[]; accomplishments?: string[] }) => {
    const bulletPoints = exp.bullets || exp.accomplishments || [];
    const baseHeight = 25; // Title, company, minimal spacing
    
    // Check if at least the header (title + company) can fit
    if (checkPageBreak(baseHeight)) {
      return; // Page break already happened
    }
    
    // If we have bullets, check if they need to span pages
    if (bulletPoints.length > 0) {
      bulletPoints.forEach((bullet: string) => {
        if (!bullet) return;
        
        const bulletLines = pdf.splitTextToSize(String(bullet), contentWidth - 8);
        const bulletHeight = bulletLines.length * 4 + 2;
        
        // Check if this bullet can fit on current page
        if (yPos + bulletHeight > pageHeight - 25) {
          addPageBreak();
        }
      });
    }
  };
  
  // Helper function to estimate space needed for a section
  const estimateSectionHeight = (lines: number, fontSize: number = 10, spacing: number = 4) => {
    return lines * (fontSize * 0.35) + (lines - 1) * spacing + 15; // Adding section header space
  };
  
  // Add background color to the first page
  pdf.setFillColor(252, 252, 253);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Count sections for better layout decisions
  const hasSkills = resumeData.skills && Object.keys(resumeData.skills).length > 0;
  const hasWorkExperience = resumeData.work_experience && resumeData.work_experience.length > 0;
  const hasProjects = resumeData.projects && resumeData.projects.length > 0;
  const hasCertifications = resumeData.certifications && resumeData.certifications.length > 0;
  const hasEducation = resumeData.education && resumeData.education.length > 0;
  
  // HEADER SECTION - always on first page
  yPos = 18; // Reduced from 20 to 18 for more space
  
  // Header with name
  pdf.setFontSize(24);
  pdf.setTextColor(26, 86, 219); // Blue color for headers
  pdf.setFont(mainFont, 'bold');
  
  // Ensure we have a name to display - use extracted name if available
  const displayName = extractedName || 
                     userName || 
                     (resumeData.contact_details?.name) || 
                     "Professional Resume";
  
  pdf.text(displayName, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 8; // Reduced from 10 to 8
  
  // Contact details
  pdf.setFontSize(10);
  pdf.setTextColor(74, 85, 104);
  pdf.setFont(mainFont, 'normal');
  
  // Try multiple sources for contact info - use extracted values first
  const email = extractedEmail || userEmail || resumeData.contact_details?.email || "";
  const phone = extractedPhone || userPhone || resumeData.contact_details?.phone || "";
  const location = extractedLocation || userLocation || resumeData.contact_details?.location || "";
  
  const contactElements = [];
  if (email) contactElements.push({ label: "Email:", value: email });
  if (phone) contactElements.push({ label: "Phone:", value: phone });
  if (location) contactElements.push({ label: "Location:", value: location.replace(/\n/g, ' ').trim() });
  
  // Display contact info in lines only if we have contact details
  if (contactElements.length > 0) {
  contactElements.forEach((element, index) => {
      const elementText = `${element.label} ${element.value}`;
      pdf.text(elementText, pageWidth / 2, yPos, { align: 'center' });
      if (index < contactElements.length - 1) yPos += 4;
    });
  }
  
  yPos += 6; // Reduced from 8 to 6
  
  // Horizontal line
  pdf.setDrawColor(26, 86, 219);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 5; // Reduced from 6 to 5
  
  // SECTION: PROFESSIONAL SUMMARY
  if (resumeData.summary) {
    // Check if summary will fit
    const summaryLines = pdf.splitTextToSize(resumeData.summary, contentWidth);
    const summaryHeight = estimateSectionHeight(summaryLines.length + 1, 10, 4);
    checkPageBreak(summaryHeight);
    
    pdf.setFontSize(14);
    pdf.setTextColor(26, 86, 219);
    pdf.setFont(mainFont, 'bold');
    pdf.text("PROFESSIONAL SUMMARY", margin, yPos);
    
    yPos += 6;
    pdf.setFontSize(10); 
    pdf.setTextColor(45, 55, 72);
    pdf.setFont(mainFont, 'normal');
    
    pdf.text(summaryLines, margin, yPos);
    yPos += summaryLines.length * 4;
    
    yPos += 6; // Reduced from 10 to 6
  }
  
  // SECTION: SKILLS
  if (hasSkills) {
    // Estimate skills height
    let skillsHeight = 20; // Base header height
    Object.entries(resumeData.skills || {}).forEach(([, skillList]) => {
      if (!skillList || !skillList.length) return;
      skillsHeight += 15; // Category header
      skillsHeight += Math.ceil((skillList as string[]).length / 6) * 8; // Pills layout estimate
    });
    
    checkPageBreak(skillsHeight);
    
    pdf.setFontSize(14);
    pdf.setTextColor(26, 86, 219);
    pdf.setFont(mainFont, 'bold');
    pdf.text("SKILLS", margin, yPos);
    
    yPos += 8;
    
    // Process each skill category
    Object.entries(resumeData.skills || {}).forEach(([category, skillList]) => {
      if (!skillList || !skillList.length) return;
      
      const formattedCategory = category
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      pdf.setFontSize(12);
      pdf.setTextColor(45, 55, 72);
      pdf.setFont(mainFont, 'bold');
      pdf.text(formattedCategory, margin, yPos);
      
      yPos += 5; // Reduced from 6 to 5
      
      // Create pill-style skills
      pdf.setFontSize(9);
      pdf.setFont(mainFont, 'normal');
      
      let xOffset = margin;
      const pillHeight = 5;
      const pillPadding = 3;
      const pillMargin = 3;
      const maxRowWidth = contentWidth - 5;
      
      // Draw skills as pills
      (skillList as string[]).forEach((skill) => {
        const skillWidth = pdf.getTextWidth(skill) + (pillPadding * 2);
        
        // Check if we need to move to next line
        if (xOffset + skillWidth > margin + maxRowWidth) {
          xOffset = margin;
          yPos += pillHeight + 2;
          
          // Check if we need a page break for the next line
          checkPageBreak(pillHeight + 5);
        }
        
        // Draw pill background
        pdf.setFillColor(240, 240, 245);
        pdf.roundedRect(xOffset, yPos - 3.5, skillWidth, pillHeight, 1.5, 1.5, 'F');
        
        // Draw skill text
        pdf.setTextColor(74, 85, 104);
        pdf.text(skill, xOffset + pillPadding, yPos);
        
        xOffset += skillWidth + pillMargin;
      });
      
      yPos += pillHeight + 4; // Reduced from 6 to 4
    });
    
    yPos += 6; // Reduced from 10 to 6
  }
  
  // SECTION: WORK EXPERIENCE
  if (hasWorkExperience) {
    checkPageBreak(30); // Minimum space for work experience header
    
    pdf.setFontSize(14);
    pdf.setTextColor(26, 86, 219);
    pdf.setFont(mainFont, 'bold');
    pdf.text("WORK EXPERIENCE", margin, yPos);
    
    yPos += 8;
    
    (resumeData.work_experience || []).forEach((exp) => {
      // Check if this entire job entry will fit on current page
      checkWorkExperiencePageBreak(exp);
      
      // Job title and dates on the same line
      pdf.setFontSize(12);
      pdf.setTextColor(45, 55, 72);
      pdf.setFont(mainFont, 'bold');
      const title = exp.title || exp.role || "Position";
      pdf.text(title, margin, yPos);
      
      const dateText = exp.dates || exp.date_range || "";
      if (dateText) {
        const datesWidth = pdf.getTextWidth(dateText);
        pdf.setFontSize(10);
        pdf.setFont(mainFont, 'normal');
        pdf.text(dateText, pageWidth - margin - datesWidth, yPos);
      }
      
      yPos += 6;
      
      // Company and location
      pdf.setFontSize(10);
      pdf.setTextColor(74, 85, 104);
      pdf.setFont(mainFont, 'italic');
      if (exp.company) {
        pdf.text(`${exp.company}${exp.location ? ` • ${exp.location}` : ''}`, margin, yPos);
      }
      
      yPos += 5; // Reduced from 6 to 5
      
      // Bullet points
      const bulletPoints = exp.bullets || exp.accomplishments || [];
      if (bulletPoints.length > 0) {
        pdf.setFontSize(10);
        pdf.setTextColor(45, 55, 72);
        pdf.setFont(mainFont, 'normal');
        
        bulletPoints.forEach((bullet) => {
          if (!bullet) return;
          
          // Check if this bullet point will fit on current page
          const bulletLines = pdf.splitTextToSize(String(bullet), contentWidth - 8);
          const bulletHeight = bulletLines.length * 4 + 2;
          
          if (yPos + bulletHeight > pageHeight - 25) {
            addPageBreak();
          }
          
          pdf.text("•", margin, yPos);
          
          const bulletIndent = margin + 4;
          const bulletWidth = contentWidth - 8;
          
          const lines = pdf.splitTextToSize(String(bullet), bulletWidth);
          if (lines && lines.length > 0) {
            pdf.text(lines, bulletIndent, yPos);
            yPos += lines.length * 4;
          }
          
          yPos += 1; // Reduced from 2 to 1
        });
      }
      
      yPos += 5; // Reduced from 8 to 5
    });
    
    yPos += 6; // Reduced from 10 to 6
  }
  
  // SECTION: PROJECTS
  if (hasProjects) {
    checkPageBreak(30); // Minimum space for projects section
    
    pdf.setFontSize(14);
    pdf.setTextColor(26, 86, 219);
    pdf.setFont(mainFont, 'bold');
    pdf.text("PROJECTS", margin, yPos);
    
    yPos += 8;
    
    (resumeData.projects || []).forEach((project) => {
      // Estimate project height
      const projectHeight = 25 + (project.description ? 15 : 0) + (project.technologies ? 8 : 0);
      checkPageBreak(projectHeight);
      
      // Project title
      pdf.setFontSize(12);
      pdf.setTextColor(45, 55, 72);
      pdf.setFont(mainFont, 'bold');
      if (project.title) {
        pdf.text(project.title, margin, yPos);
      }
      
      yPos += 5; // Reduced from 6 to 5
      
      // Project description
      if (project.description) {
        pdf.setFontSize(10);
        pdf.setFont(mainFont, 'normal');
        const descLines = pdf.splitTextToSize(project.description, contentWidth);
        pdf.text(descLines, margin, yPos);
        yPos += descLines.length * 4;
      }
      
      // Technologies
      if (project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0) {
        pdf.setFontSize(9);
        pdf.setTextColor(44, 82, 130);
        pdf.setFont(mainFont, 'italic');
        
          const validTechs = project.technologies.filter(tech => tech && typeof tech === 'string');
          if (validTechs.length > 0) {
          const techText = "Technologies: " + validTechs.join(', ');
          const techLines = pdf.splitTextToSize(techText, contentWidth);
          pdf.text(techLines, margin, yPos);
          yPos += techLines.length * 4;
        }
      }
      
      yPos += 5; // Reduced from 8 to 5
    });
    
    yPos += 6; // Reduced from 10 to 6
  }
  
  // SECTION: EDUCATION
  if (hasEducation) {
    checkPageBreak(30); // Minimum space for education
    
    pdf.setFontSize(14);
    pdf.setTextColor(26, 86, 219);
    pdf.setFont(mainFont, 'bold');
    pdf.text("EDUCATION", margin, yPos);
    
    yPos += 8;
    
    (resumeData.education || []).forEach((edu) => {
      checkPageBreak(15); // Space for one education entry
      
      // Degree and date
      pdf.setFontSize(12);
      pdf.setTextColor(45, 55, 72);
      pdf.setFont(mainFont, 'bold');
      if (edu.degree) {
        pdf.text(edu.degree, margin, yPos);
      }
      
      if (edu.dates) {
        const datesWidth = pdf.getTextWidth(edu.dates);
        pdf.setFontSize(10);
        pdf.setFont(mainFont, 'normal');
        pdf.text(edu.dates, pageWidth - margin - datesWidth, yPos);
      }
      
      yPos += 5;
      
      // School
      pdf.setFontSize(10);
      pdf.setFont(mainFont, 'italic');
      if (edu.school) {
        pdf.text(edu.school, margin, yPos);
      }
      
      yPos += 5; // Reduced from 8 to 5
    });
    
    yPos += 6; // Reduced from 10 to 6
  }
  
  // SECTION: CERTIFICATIONS
  if (hasCertifications) {
    const certCount = (resumeData.certifications || []).length;
    checkPageBreak(20 + (certCount * 5)); // Estimate certifications height
    
    pdf.setFontSize(14);
    pdf.setTextColor(26, 86, 219);
    pdf.setFont(mainFont, 'bold');
    pdf.text("CERTIFICATIONS", margin, yPos);
    
    yPos += 6; // Reduced from 8 to 6
    
    pdf.setFontSize(10);
    pdf.setTextColor(45, 55, 72);
    pdf.setFont(mainFont, 'normal');
    
    (resumeData.certifications || []).forEach((cert) => {
      if (!cert || typeof cert !== 'string') return;
      
      checkPageBreak(8); // Space for one certification
      
      pdf.text("•", margin, yPos);
      
      const bulletIndent = margin + 4;
      const bulletWidth = contentWidth - 4;
      
      const lines = pdf.splitTextToSize(cert, bulletWidth);
      if (lines && lines.length > 0) {
        pdf.text(lines, bulletIndent, yPos);
        yPos += lines.length * 4;
      }
      
      yPos += 1; // Reduced from 2 to 1
    });
  }
  
  // Add footer to all pages
  for (let page = 1; page <= currentPage; page++) {
    if (page > 1) {
      pdf.setPage(page);
    }
    
    // Footer with generation date and page number
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
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