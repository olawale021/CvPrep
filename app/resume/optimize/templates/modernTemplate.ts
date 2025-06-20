import jsPDF from "jspdf";
import { ResumeData, ResumeResponse } from "../types";

/**
 * Generates a modern style resume PDF
 */
export const generateModernTemplate = async (resumeData: ResumeData, resumeResponse: ResumeResponse | null) => {
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
  
  // Debug logging to understand the data structure
  // console.log("=== MODERN TEMPLATE DEBUG ===");
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
  
  // Use a modern sans-serif font
  const mainFont = 'helvetica';
  
  // Set dimensions and spacing
  const margin = 18;
  let yPos = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (margin * 2);
  let currentPage = 1;
  
  // Page break function
  const addPageBreak = () => {
    pdf.addPage();
    currentPage++;
    yPos = 20; // Reset y position for new page
    
    // Add background colors to new page
    pdf.setFillColor(250, 250, 252); // Very light background
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Add side column background to new page
    pdf.setFillColor(240, 242, 246); // Light gray/blue for side column
    pdf.rect(margin, margin, sideColumnWidth, pageHeight - (margin * 2), 'F');
    
    // Add page number
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
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
  
  // Count sections for spacing calculations
  const hasSkills = resumeData.skills && Object.keys(resumeData.skills).length > 0;
  const hasWorkExperience = resumeData.work_experience && resumeData.work_experience.length > 0;
  const hasProjects = resumeData.projects && resumeData.projects.length > 0;
  const hasCertifications = resumeData.certifications && resumeData.certifications.length > 0;
  const hasEducation = resumeData.education && resumeData.education.length > 0;
  
  const significantSections = [
    hasSkills, 
    hasWorkExperience, 
    hasProjects, 
    hasCertifications, 
    hasEducation
  ].filter(Boolean).length;
  
  // Calculate content density for adaptive spacing
  const getContentDensity = () => {
    const experienceEntries = (resumeData.work_experience?.length || 0);
    const projectEntries = (resumeData.projects?.length || 0);
    const educationEntries = (resumeData.education?.length || 0);
    const totalEntries = experienceEntries + projectEntries + educationEntries;
    
    let totalBullets = 0;
    if (resumeData.work_experience) {
      resumeData.work_experience.forEach(exp => {
        totalBullets += exp.bullets?.length || 0;
      });
    }
    
    return {
      isHighDensity: totalEntries > 5 || totalBullets > 10 || significantSections >= 5,
      isVeryDense: totalEntries > 7 || totalBullets > 14 || significantSections >= 6
    };
  };
  
  const contentDensity = getContentDensity();
  
  // Calculate scaling factors based on content density
  const fontScaling = contentDensity.isVeryDense ? 0.85 : 
                     contentDensity.isHighDensity ? 0.92 : 1.0;
  
  // Modern template uses a side column for skills and education
  const sideColumnWidth = 55; // mm
  const mainColumnWidth = contentWidth - sideColumnWidth - 5; // 5mm gap between columns
  const mainColumnStart = margin + sideColumnWidth + 5;
  
  // Add background colors
  pdf.setFillColor(250, 250, 252); // Very light background
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Add side column background
  pdf.setFillColor(240, 242, 246); // Light gray/blue for side column
  pdf.rect(margin, margin, sideColumnWidth, pageHeight - (margin * 2), 'F');
  
  // HEADER SECTION - spans across the top
  pdf.setFontSize(fontScaling * 26);
  pdf.setTextColor(45, 55, 72); // Dark gray
  pdf.setFont(mainFont, 'bold');
  
  // Ensure we have a name to display - use extracted name if available
  const displayName = extractedName || 
                     userName || 
                     (resumeData.contact_details?.name) || 
                     "Professional Resume";
  
  pdf.text(displayName, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 8;
  
  // Contact details centered
  pdf.setFontSize(fontScaling * 9);
  pdf.setTextColor(74, 85, 104); // Gray
  pdf.setFont(mainFont, 'normal');
  
  // Modern contact details display as horizontal line
  const contactParts = [];
  
  // Try multiple sources for contact info - use extracted values first
  const email = extractedEmail || userEmail || resumeData.contact_details?.email || "";
  const phone = extractedPhone || userPhone || resumeData.contact_details?.phone || "";
  const location = extractedLocation || userLocation || resumeData.contact_details?.location || "";
  
  if (email) contactParts.push(email);
  if (phone) contactParts.push(phone);
  if (location) contactParts.push(location.replace(/\n/g, ' ').trim());
  
  // Only display contact line if we have at least one contact detail
  if (contactParts.length > 0) {
  const contactText = contactParts.join(' | ');
  pdf.text(contactText, pageWidth / 2, yPos, { align: 'center' });
  }
  
  yPos += 10;
  
  // SIDE COLUMN
  // Side column should start right after the header, not after main column content
  let sideColYPos = yPos; // Start side column at the same position as main column
  
  // Skills Section in side column - render first
  if (hasSkills) {
    pdf.setFontSize(fontScaling * 12);
    pdf.setTextColor(45, 55, 72);
    pdf.setFont(mainFont, 'bold');
    pdf.text("SKILLS", margin + 4, sideColYPos);
    
    pdf.setDrawColor(74, 85, 104);
    pdf.setLineWidth(0.3);
    pdf.line(margin + 4, sideColYPos + 1, margin + sideColumnWidth - 4, sideColYPos + 1);
    
    sideColYPos += 6;
    
    Object.entries(resumeData.skills || {}).forEach(([category, skillList]) => {
      if (!skillList || !skillList.length) return;
      
      // Category heading
      const formattedCategory = category
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      pdf.setFontSize(fontScaling * 10);
      pdf.setTextColor(45, 55, 72);
      pdf.setFont(mainFont, 'bold');
      pdf.text(formattedCategory, margin + 4, sideColYPos);
      
      sideColYPos += 4;
      
      // Skills as a wrapped list
      pdf.setFontSize(fontScaling * 8);
      pdf.setTextColor(74, 85, 104);
      pdf.setFont(mainFont, 'normal');
      
      if (Array.isArray(skillList) && skillList.length > 0) {
        // Filter out any invalid skills
        const validSkills = skillList.filter(skill => skill && typeof skill === 'string');
        
        if (validSkills.length > 0) {
          const skillText = validSkills.join(', ');
          const skillLines = pdf.splitTextToSize(skillText, sideColumnWidth - 8);
          pdf.text(skillLines, margin + 4, sideColYPos);
          sideColYPos += skillLines.length * 3.5 + 4;
        }
      }
    });
    
    sideColYPos += 6;
  }
  
  // Education in side column - render second
  if (hasEducation) {
    pdf.setFontSize(fontScaling * 12);
    pdf.setTextColor(45, 55, 72);
    pdf.setFont(mainFont, 'bold');
    pdf.text("EDUCATION", margin + 4, sideColYPos);
    
    pdf.setDrawColor(74, 85, 104);
    pdf.setLineWidth(0.3);
    pdf.line(margin + 4, sideColYPos + 1, margin + sideColumnWidth - 4, sideColYPos + 1);
    
    sideColYPos += 6;
    
    (resumeData.education || []).forEach((edu) => {
      // Degree
      pdf.setFontSize(fontScaling * 9);
      pdf.setTextColor(45, 55, 72);
      pdf.setFont(mainFont, 'bold');
      
      // Split long degree texts
      const degreeText = edu.degree || "Degree";
      const degreeLines = pdf.splitTextToSize(degreeText, sideColumnWidth - 8);
      pdf.text(degreeLines, margin + 4, sideColYPos);
      
      sideColYPos += degreeLines.length * 4;
      
      // School
      pdf.setFontSize(fontScaling * 8);
      pdf.setTextColor(74, 85, 104);
      pdf.setFont(mainFont, 'italic');
      if (edu.school) {
        pdf.text(edu.school, margin + 4, sideColYPos);
        sideColYPos += 3;
      }
      
      // Dates
      pdf.setFontSize(fontScaling * 8);
      pdf.setFont(mainFont, 'normal');
      if (edu.dates) {
        pdf.text(edu.dates, margin + 4, sideColYPos);
        sideColYPos += 6;
      } else {
        sideColYPos += 3; // Add some spacing even without dates
      }
    });
    
    sideColYPos += 6;
  }
  
  // Certifications in side column - render third if space allows
  if (hasCertifications) {
    // Check if we have enough space in the side column on first page
    if (sideColYPos < pageHeight - 60) { // If we have at least 60mm left
      pdf.setFontSize(fontScaling * 12);
      pdf.setTextColor(45, 55, 72);
      pdf.setFont(mainFont, 'bold');
      pdf.text("CERTIFICATIONS", margin + 4, sideColYPos);
      
      pdf.setDrawColor(74, 85, 104);
      pdf.setLineWidth(0.3);
      pdf.line(margin + 4, sideColYPos + 1, margin + sideColumnWidth - 4, sideColYPos + 1);
      
      sideColYPos += 6;
      
      pdf.setFontSize(fontScaling * 8);
      pdf.setTextColor(74, 85, 104);
      pdf.setFont(mainFont, 'normal');
      
      (resumeData.certifications || []).forEach((cert) => {
        // Skip invalid certifications
        if (!cert || typeof cert !== 'string') return;
        
        const lines = pdf.splitTextToSize(cert, sideColumnWidth - 8).slice(0, 1);
        pdf.text("•", margin + 4, sideColYPos);
        if (lines && lines.length > 0) {
          pdf.text(lines, margin + 8, sideColYPos);
        }
        sideColYPos += 4;
      });
    }
  }
  
  // MAIN COLUMN - work experience and projects
  // Summary first if available
  if (resumeData.summary) {
    pdf.setFontSize(fontScaling * 12);
    pdf.setTextColor(45, 55, 72); // Dark gray
    pdf.setFont(mainFont, 'bold');
    pdf.text("PROFESSIONAL SUMMARY", mainColumnStart, yPos);
    
    pdf.setDrawColor(74, 85, 104);
    pdf.setLineWidth(0.3);
    pdf.line(mainColumnStart, yPos + 1, pageWidth - margin, yPos + 1);
    
    yPos += 6;
    
    pdf.setFontSize(fontScaling * 9);
    pdf.setTextColor(74, 85, 104);
    pdf.setFont(mainFont, 'normal');
    
    const maxLines = contentDensity.isVeryDense ? 3 : 
                    contentDensity.isHighDensity ? 4 : 5;
    const summaryLines = pdf.splitTextToSize(resumeData.summary, mainColumnWidth);
    const limitedSummary = summaryLines.slice(0, maxLines);
    pdf.text(limitedSummary, mainColumnStart, yPos);
    
    yPos += limitedSummary.length * 4 + 8;
  }
  
  // Work Experience
  if (hasWorkExperience) {
    // Check if section header will fit
    checkPageBreak(20);
    
    pdf.setFontSize(fontScaling * 12);
    pdf.setTextColor(45, 55, 72); // Dark gray
    pdf.setFont(mainFont, 'bold');
    pdf.text("WORK EXPERIENCE", mainColumnStart, yPos);
    
    pdf.setDrawColor(74, 85, 104);
    pdf.setLineWidth(0.3);
    pdf.line(mainColumnStart, yPos + 1, pageWidth - margin, yPos + 1);
    
    yPos += 6;
    
    (resumeData.work_experience || []).forEach((exp, index) => {
      // Estimate space needed for this experience entry
      const bulletPoints = exp.bullets || exp.accomplishments || [];
      const estimatedHeight = 15 + (bulletPoints.length * 12); // Base height + bullets
      
      // Check if we need a page break before starting this experience
      checkPageBreak(estimatedHeight);
      
      // Job title
      pdf.setFontSize(fontScaling * 11);
      pdf.setTextColor(45, 55, 72);
      pdf.setFont(mainFont, 'bold');
      if (exp.title || exp.role) {
        pdf.text(exp.title || exp.role || "Position", mainColumnStart, yPos);
      } else {
        pdf.text("Position", mainColumnStart, yPos); // Fallback text
      }
      
      // Date on the right
      const dateText = exp.dates || exp.date_range || "";
      if (dateText) {
        const dateWidth = pdf.getTextWidth(dateText);
        pdf.setFontSize(fontScaling * 9);
        pdf.setFont(mainFont, 'normal');
        pdf.text(dateText, pageWidth - margin - dateWidth, yPos);
      }
      
      yPos += 4;
      
      // Company and location
      pdf.setFontSize(fontScaling * 10);
      pdf.setTextColor(74, 85, 104);
      pdf.setFont(mainFont, 'italic');
      if (exp.company) {
        pdf.text(`${exp.company}${exp.location ? ` • ${exp.location}` : ''}`, mainColumnStart, yPos);
      }
      
      yPos += 5;
      
      // Bullet points
      const hasBullets = (exp.bullets && exp.bullets.length > 0) || (exp.accomplishments && exp.accomplishments.length > 0);
      if (hasBullets) {
        pdf.setFontSize(fontScaling * 9);
        pdf.setTextColor(74, 85, 104);
        pdf.setFont(mainFont, 'normal');
        
        // Get bullets from either bullets or accomplishments array - show all bullets
        const bulletPoints = exp.bullets || exp.accomplishments || [];
        
        bulletPoints.forEach((bullet) => {
          // Skip empty bullets
          if (!bullet) return;
          
          // Check if this bullet will fit on current page
          const bulletLines = pdf.splitTextToSize(String(bullet), mainColumnWidth - 4);
          const bulletHeight = bulletLines.length * 4 + 2;
          
          if (yPos + bulletHeight > pageHeight - 25) {
            addPageBreak();
          }
          
          // Use bullet symbol
          pdf.text("•", mainColumnStart, yPos);
          
          // Indent text
          const bulletIndent = mainColumnStart + 4;
          const maxWidth = mainColumnWidth - 4;
          
          // Ensure bullet is a string
          const bulletText = typeof bullet === 'string' ? bullet : String(bullet || '');
          
          // Wrap text as needed - allow up to 3 lines per bullet for better readability
          const lines = pdf.splitTextToSize(bulletText, maxWidth).slice(0, 3);
          if (lines && lines.length > 0) {
            pdf.text(lines, bulletIndent, yPos);
            yPos += lines.length * 4 + 1;
          } else {
            yPos += 4; // Add spacing even without text
          }
        });
      }
      
      // Add space between experiences
      if (index < (resumeData.work_experience?.length || 0) - 1) {
        yPos += 5;
      }
    });
    
    yPos += 10;
  }
  
  // Projects Section
  if (hasProjects) {
    // Check if section header will fit
    checkPageBreak(20);
    
    pdf.setFontSize(fontScaling * 12);
    pdf.setTextColor(45, 55, 72);
    pdf.setFont(mainFont, 'bold');
    pdf.text("PROJECTS", mainColumnStart, yPos);
    
    pdf.setDrawColor(74, 85, 104);
    pdf.setLineWidth(0.3);
    pdf.line(mainColumnStart, yPos + 1, pageWidth - margin, yPos + 1);
    
    yPos += 6;
    
    (resumeData.projects || []).forEach((project, index) => {
      // Estimate space needed for this project entry
      const estimatedHeight = 25; // Base height for title, description, and technologies
      
      // Check if we need a page break before starting this project
      checkPageBreak(estimatedHeight);
      
      // Project title
      pdf.setFontSize(fontScaling * 11);
      pdf.setTextColor(45, 55, 72);
      pdf.setFont(mainFont, 'bold');
      if (project.title) {
        pdf.text(project.title, mainColumnStart, yPos);
      } else {
        pdf.text("Project", mainColumnStart, yPos); // Fallback text
      }
      
      yPos += 4;
      
      // Project description
      pdf.setFontSize(fontScaling * 9);
      pdf.setTextColor(74, 85, 104);
      pdf.setFont(mainFont, 'normal');
      
      if (project.description) {
        const descLines = pdf.splitTextToSize(project.description, mainColumnWidth).slice(0, 2);
        pdf.text(descLines, mainColumnStart, yPos);
        yPos += descLines.length * 4 + 1;
      } else {
        yPos += 4; // Add some spacing even without description
      }
      
      // Technologies
      if (project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0) {
        pdf.setFontSize(fontScaling * 8);
        pdf.setTextColor(75, 85, 126);
        pdf.setFont(mainFont, 'italic');
        
        let techText = "Technologies: ";
        
        // Safely process technologies
        if (Array.isArray(project.technologies)) {
          // Filter out any non-string or empty values
          const validTechs = project.technologies.filter(tech => tech && typeof tech === 'string');
          if (validTechs.length > 0) {
            techText += validTechs.join(', ');
          } else {
            techText += "Various technologies";
          }
        } else if (typeof project.technologies === 'string') {
          techText += project.technologies;
        } else {
          techText += "Various technologies";
        }
        
        const techLines = pdf.splitTextToSize(techText, mainColumnWidth).slice(0, 1);
        if (techLines && techLines.length > 0) {
          pdf.text(techLines, mainColumnStart, yPos);
        }
        
        yPos += 4;
      }
      
      // Space between projects
      if (index < (resumeData.projects?.length || 0) - 1) {
        yPos += 5;
      }
    });
  }
  
  // Handle certifications that don't fit in side column
  if (hasCertifications && sideColYPos >= pageHeight - 60) {
      // Not enough space in side column, add to main column
      yPos += 10;
      
      pdf.setFontSize(fontScaling * 12);
      pdf.setTextColor(45, 55, 72);
      pdf.setFont(mainFont, 'bold');
      pdf.text("CERTIFICATIONS", mainColumnStart, yPos);
      
      pdf.setDrawColor(74, 85, 104);
      pdf.setLineWidth(0.3);
      pdf.line(mainColumnStart, yPos + 1, pageWidth - margin, yPos + 1);
      
      yPos += 6;
      
      pdf.setFontSize(fontScaling * 9);
      pdf.setTextColor(74, 85, 104);
      pdf.setFont(mainFont, 'normal');
      
      (resumeData.certifications || []).forEach((cert) => {
        // Skip invalid certifications
        if (!cert || typeof cert !== 'string') return;
        
        pdf.text("•", mainColumnStart, yPos);
        const lines = pdf.splitTextToSize(cert, mainColumnWidth - 4).slice(0, 1);
        if (lines && lines.length > 0) {
          pdf.text(lines, mainColumnStart + 4, yPos);
        }
        yPos += 4;
      });
  }

  // Add footer with generation date and page number
  const currentDate = new Date().toLocaleDateString();
  pdf.setFontSize(7);
  pdf.setTextColor(150, 150, 150);
  pdf.setFont(mainFont, 'italic');
  
  // Add page number on first page
  pdf.text(`Page 1 of ${currentPage}`, pageWidth - margin - 15, pageHeight - 10);
  
  const footerText = `Resume generated on ${currentDate} · CvPrep.app`;
  const footerWidth = pdf.getTextWidth(footerText);
  pdf.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 10);
  
  // Update page numbers on all pages
  for (let i = 1; i <= currentPage; i++) {
    if (i > 1) {
      pdf.setPage(i);
      pdf.setFontSize(7);
      pdf.setTextColor(150, 150, 150);
      pdf.setFont(mainFont, 'italic');
      pdf.text(`Page ${i} of ${currentPage}`, pageWidth - margin - 15, pageHeight - 10);
    }
  }
  
  return pdf;
}; 