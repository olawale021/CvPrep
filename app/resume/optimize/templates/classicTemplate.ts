import jsPDF from "jspdf";
import { ResumeData, ResumeResponse } from "../types";

/**
 * Generates a classic style resume PDF with multi-page support and optimized spacing
 */
export const generateClassicTemplate = async (resumeData: ResumeData, resumeResponse: ResumeResponse | null) => {
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
  
  // Page settings - optimized for maximum content
  const margin = 12; // Reduced from 15mm
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
    pdf.text(`Page ${currentPage}`, pageWidth - margin - 10, pageHeight - 8);
  };
  
  // Check if we need page break - more aggressive space utilization
  const checkPageBreak = (spaceNeeded: number) => {
    const availableSpace = pageHeight - yPos - 8; // Reduced buffer from 10mm to 8mm
    
    if (spaceNeeded > availableSpace) {
      addPageBreak();
      return true;
    }
    return false;
  };
  
  // Special function for work experience that might need to break mid-entry
  const checkWorkExperiencePageBreak = (exp: { bullets?: string[]; accomplishments?: string[] }) => {
    const bulletPoints = exp.bullets || exp.accomplishments || [];
    const baseHeight = 20; // Reduced from 25mm
    
    // Check if at least the header (title + company) can fit
    if (checkPageBreak(baseHeight)) {
      return;
    }
    
    // If we have bullets, check if they need to span pages
    if (bulletPoints.length > 0) {
      bulletPoints.forEach((bullet: string) => {
        if (!bullet) return;
        
        const bulletLines = pdf.splitTextToSize(String(bullet), contentWidth - 8);
        const bulletHeight = bulletLines.length * 3.5 + 1.5; // Reduced line height
        
        // Check if this bullet can fit on current page
        if (yPos + bulletHeight > pageHeight - 12) {
          addPageBreak();
        }
      });
    }
  };
  
  // Helper function to estimate space needed for a section
  const estimateSectionHeight = (lines: number, fontSize: number = 10, spacing: number = 3.5) => {
    return lines * (fontSize * 0.35) + (lines - 1) * spacing + 8; // Reduced header space
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
  
  // Estimate total content height to determine if we need to expand spacing
  const estimateTotalContentHeight = () => {
    let totalHeight = 50; // Header section (more accurate)
    
    // Summary
    if (resumeData.summary) {
      const summaryLines = pdf.splitTextToSize(resumeData.summary, contentWidth);
      totalHeight += 25 + (summaryLines.length * 4.5); // More accurate spacing
    }
    
    // Skills
    if (hasSkills) {
      totalHeight += 35; // Base skills section header
      Object.entries(resumeData.skills || {}).forEach(([, skillList]) => {
        if (skillList && skillList.length) {
          totalHeight += 20 + Math.ceil((skillList as string[]).length / 8) * 8; // More accurate pill layout
        }
      });
    }
    
    // Work Experience
    if (hasWorkExperience) {
      totalHeight += 30; // Header
      (resumeData.work_experience || []).forEach((exp) => {
        totalHeight += 25; // Title, company, dates
        const bullets = exp.bullets || exp.accomplishments || [];
        totalHeight += bullets.length * 6; // More accurate bullet spacing
      });
    }
    
    // Projects
    if (hasProjects) {
      totalHeight += 30; // Header
      (resumeData.projects || []).forEach((project) => {
        totalHeight += 20; // Title and spacing
        if (project.description) totalHeight += 18;
        if (project.technologies) totalHeight += 10;
      });
    }
    
    // Education
    if (hasEducation) {
      totalHeight += 30 + ((resumeData.education || []).length * 18); // More accurate education spacing
    }
    
    // Certifications
    if (hasCertifications) {
      totalHeight += 25 + ((resumeData.certifications || []).length * 8); // More accurate cert spacing
    }
    
    return totalHeight;
  };
  
  const estimatedHeight = estimateTotalContentHeight();
  const availableHeight = pageHeight - 20; // Account for margins
  const contentRatio = estimatedHeight / availableHeight;
  
  // More aggressive space utilization - use extra space when content uses less than 85% of page
  const hasExtraSpace = contentRatio < 0.85;
  const hasLotsOfSpace = contentRatio < 0.65; // Very sparse content
  
  // Dynamic spacing multipliers based on available space
  let spacingMultiplier = 1.0;
  let fontSizeBoost = 0;
  
  if (hasLotsOfSpace) {
    // Very sparse content - use much more space
    spacingMultiplier = 1.8;
    fontSizeBoost = 2;
  } else if (hasExtraSpace) {
    // Some extra space - moderate expansion
    spacingMultiplier = 1.4;
    fontSizeBoost = 1;
  }
  
  // HEADER SECTION - Dynamic spacing based on content
  yPos = hasExtraSpace ? 15 : 12; // More space if available
  
  // Header with name - dynamic font size
  pdf.setFontSize(23 + fontSizeBoost); // Dynamic font size
  pdf.setTextColor(26, 86, 219);
  pdf.setFont(mainFont, 'bold');
  
  const displayName = extractedName || 
                     userName || 
                     (resumeData.contact_details?.name) || 
                     "Professional Resume";
  
  pdf.text(displayName, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += Math.round(5 * spacingMultiplier); // Dynamic spacing
  
  // Contact details - dynamic layout
  pdf.setFontSize(10 + fontSizeBoost); // Dynamic font size
  pdf.setTextColor(74, 85, 104);
  pdf.setFont(mainFont, 'normal');
  
  const email = extractedEmail || userEmail || resumeData.contact_details?.email || "";
  const phone = extractedPhone || userPhone || resumeData.contact_details?.phone || "";
  const location = extractedLocation || userLocation || resumeData.contact_details?.location || "";
  
  // Create compact contact line with location first, then email, then phone
  const contactParts = [];
  if (location) contactParts.push(location.replace(/\n/g, ' ').trim());
  if (email) contactParts.push(email);
  if (phone) contactParts.push(phone);
  
  if (contactParts.length > 0) {
    const contactLine = contactParts.join(' • ');
    pdf.text(contactLine, pageWidth / 2, yPos, { align: 'center' });
    yPos += Math.round(4 * spacingMultiplier); // Slightly more spacing
  }
  
  yPos += Math.round(3 * spacingMultiplier); // More spacing before line
  
  // Horizontal line
  pdf.setDrawColor(26, 86, 219);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += Math.round(4 * spacingMultiplier); // More spacing after line
  
  // SECTION: PROFESSIONAL SUMMARY - Dynamic spacing
  if (resumeData.summary) {
    // Set font size first to ensure accurate text measurement
    pdf.setFontSize(11 + fontSizeBoost); // Set font size before measuring
    pdf.setFont(mainFont, 'normal');
    
    // Use a slightly smaller width to ensure text doesn't overflow
    const summaryWidth = contentWidth - 2; // 2mm safety margin
    const summaryLines = pdf.splitTextToSize(resumeData.summary, summaryWidth);
    const summaryHeight = estimateSectionHeight(summaryLines.length + 1, 11, 4);
    checkPageBreak(summaryHeight);
    
    // Header
    pdf.setFontSize(14 + fontSizeBoost); // Dynamic font size
    pdf.setTextColor(26, 86, 219);
    pdf.setFont(mainFont, 'bold');
    pdf.text("PROFESSIONAL SUMMARY", margin, yPos);
    
    yPos += Math.round(5 * spacingMultiplier); // More spacing after header
    
    // Summary content
    pdf.setFontSize(11 + fontSizeBoost); // Dynamic font size
    pdf.setTextColor(45, 55, 72);
    pdf.setFont(mainFont, 'normal');
    
    // Render summary with proper line spacing and ensure it fits within margins
    summaryLines.forEach((line: string, index: number) => {
      // Ensure the line doesn't exceed the page width
      const lineWidth = pdf.getTextWidth(line);
      if (lineWidth > summaryWidth) {
        // If line is still too long, split it further
        const subLines = pdf.splitTextToSize(line, summaryWidth - 1);
        subLines.forEach((subLine: string, subIndex: number) => {
          pdf.text(subLine, margin, yPos);
          if (subIndex < subLines.length - 1) {
            yPos += Math.round(4 * spacingMultiplier);
          }
        });
      } else {
        pdf.text(line, margin, yPos);
      }
      
      if (index < summaryLines.length - 1) {
        yPos += Math.round(4 * spacingMultiplier); // Better line spacing
      }
    });
    
    yPos += Math.round(8 * spacingMultiplier); // More spacing after summary
    
    // Add extra spacing between major sections when there's lots of space
    if (hasLotsOfSpace) {
      yPos += Math.round(6 * spacingMultiplier);
    } else if (hasExtraSpace) {
      yPos += Math.round(3 * spacingMultiplier);
    }
  }
  
  // SECTION: SKILLS - Dynamic spacing
  if (hasSkills) {
    let skillsHeight = 12; // Reduced base height
    Object.entries(resumeData.skills || {}).forEach(([, skillList]) => {
      if (!skillList || !skillList.length) return;
      skillsHeight += 8; // Reduced category header
      skillsHeight += Math.ceil((skillList as string[]).length / 10) * 5; // More compact estimate
    });
    
    checkPageBreak(skillsHeight);
    
    pdf.setFontSize(14 + fontSizeBoost); // Dynamic font size
    pdf.setTextColor(26, 86, 219);
    pdf.setFont(mainFont, 'bold');
    pdf.text("SKILLS", margin, yPos);
    
    yPos += Math.round(6 * spacingMultiplier); // Dynamic spacing
    
    // Process each skill category
    Object.entries(resumeData.skills || {}).forEach(([category, skillList]) => {
      if (!skillList || !skillList.length) return;
      
      const formattedCategory = category
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      pdf.setFontSize(12 + fontSizeBoost); // Dynamic font size
      pdf.setTextColor(45, 55, 72);
      pdf.setFont(mainFont, 'bold');
      pdf.text(formattedCategory, margin, yPos);
      
      yPos += Math.round(4 * spacingMultiplier); // Dynamic spacing
      
      // Create pill-style skills - dynamic sizing
      pdf.setFontSize(9.5 + fontSizeBoost); // Dynamic font size
      pdf.setFont(mainFont, 'normal');
      
      let xOffset = margin;
      const pillHeight = 4.5; // Reduced from 5
      const pillPadding = 2.5; // Reduced from 3
      const pillMargin = 2.5; // Reduced from 3
      const maxRowWidth = contentWidth - 3;
      
      // Draw skills as pills
      (skillList as string[]).forEach((skill) => {
        const skillWidth = pdf.getTextWidth(skill) + (pillPadding * 2);
        
        // Check if we need to move to next line
        if (xOffset + skillWidth > margin + maxRowWidth) {
          xOffset = margin;
          yPos += pillHeight + (1.5 * spacingMultiplier); // Dynamic spacing
          
          checkPageBreak(pillHeight + 4);
        }
        
        // Draw pill background
        pdf.setFillColor(240, 240, 245);
        pdf.roundedRect(xOffset, yPos - 3, skillWidth, pillHeight, 1.5, 1.5, 'F');
        
        // Draw skill text
        pdf.setTextColor(74, 85, 104);
        pdf.text(skill, xOffset + pillPadding, yPos);
        
        xOffset += skillWidth + pillMargin;
      });
      
      yPos += pillHeight + Math.round(3 * spacingMultiplier); // Dynamic spacing
    });
    
    yPos += Math.round(4 * spacingMultiplier); // Dynamic spacing
    
    // Add extra spacing between major sections when there's lots of space
    if (hasLotsOfSpace) {
      yPos += Math.round(8 * spacingMultiplier);
    }
  }
  
  // SECTION: WORK EXPERIENCE - Dynamic spacing
  if (hasWorkExperience) {
    checkPageBreak(25); // Reduced minimum space
    
    pdf.setFontSize(14 + fontSizeBoost); // Dynamic font size
    pdf.setTextColor(26, 86, 219);
    pdf.setFont(mainFont, 'bold');
    pdf.text("WORK EXPERIENCE", margin, yPos);
    
    yPos += Math.round(6 * spacingMultiplier); // Dynamic spacing
    
    (resumeData.work_experience || []).forEach((exp, index) => {
      checkWorkExperiencePageBreak(exp);
      
      // Job title and dates on the same line
      pdf.setFontSize(12 + fontSizeBoost); // Dynamic font size
      pdf.setTextColor(45, 55, 72);
      pdf.setFont(mainFont, 'bold');
      const title = exp.title || exp.role || "Position";
      pdf.text(title, margin, yPos);
      
      const dateText = exp.dates || exp.date_range || "";
      if (dateText) {
        const datesWidth = pdf.getTextWidth(dateText);
        pdf.setFontSize(10 + fontSizeBoost); // Dynamic font size
        pdf.setFont(mainFont, 'normal');
        pdf.text(dateText, pageWidth - margin - datesWidth, yPos);
      }
      
      yPos += Math.round(5 * spacingMultiplier); // Dynamic spacing
      
      // Company and location
      pdf.setFontSize(10 + fontSizeBoost); // Dynamic font size
      pdf.setTextColor(74, 85, 104);
      pdf.setFont(mainFont, 'italic');
      if (exp.company) {
        pdf.text(`${exp.company}${exp.location ? ` • ${exp.location}` : ''}`, margin, yPos);
      }
      
      yPos += Math.round(4 * spacingMultiplier); // Dynamic spacing
      
              // Bullet points - dynamic spacing
      const bulletPoints = exp.bullets || exp.accomplishments || [];
      if (bulletPoints.length > 0) {
          pdf.setFontSize(10 + fontSizeBoost); // Dynamic font size
        pdf.setTextColor(45, 55, 72);
        pdf.setFont(mainFont, 'normal');
        
        bulletPoints.forEach((bullet) => {
          if (!bullet) return;
          
          const bulletLines = pdf.splitTextToSize(String(bullet), contentWidth - 8);
          const bulletHeight = bulletLines.length * 3.5 + 1.5; // Reduced line height
          
          if (yPos + bulletHeight > pageHeight - 20) {
            addPageBreak();
          }
          
          pdf.text("•", margin, yPos);
          
          const bulletIndent = margin + 4;
          const bulletWidth = contentWidth - 8;
          
          const lines = pdf.splitTextToSize(String(bullet), bulletWidth);
          if (lines && lines.length > 0) {
            pdf.text(lines, bulletIndent, yPos);
            yPos += lines.length * (3.5 * spacingMultiplier); // Dynamic line spacing
          }
          
          yPos += Math.round(0.5 * spacingMultiplier); // Dynamic bullet spacing
        });
      }
      
      // Add spacing between jobs, but less for last job
      const jobSpacing = index === (resumeData.work_experience || []).length - 1 ? 3 : 4;
      yPos += Math.round(jobSpacing * spacingMultiplier);
    });
    
    yPos += Math.round(4 * spacingMultiplier); // Dynamic section spacing
    
    // Add extra spacing between major sections when there's lots of space
    if (hasLotsOfSpace) {
      yPos += Math.round(8 * spacingMultiplier);
    }
  }
  
  // SECTION: PROJECTS - Dynamic spacing
  if (hasProjects) {
    checkPageBreak(25); // Reduced minimum space
    
    pdf.setFontSize(14 + fontSizeBoost); // Dynamic font size
    pdf.setTextColor(26, 86, 219);
    pdf.setFont(mainFont, 'bold');
    pdf.text("PROJECTS", margin, yPos);
    
    yPos += Math.round(6 * spacingMultiplier); // Dynamic spacing
    
    (resumeData.projects || []).forEach((project, index) => {
      const projectHeight = 20 + (project.description ? 12 : 0) + (project.technologies ? 6 : 0);
      checkPageBreak(projectHeight);
      
      // Project title
      pdf.setFontSize(12 + fontSizeBoost); // Dynamic font size
      pdf.setTextColor(45, 55, 72);
      pdf.setFont(mainFont, 'bold');
      if (project.title) {
        pdf.text(project.title, margin, yPos);
      }
      
      yPos += Math.round(4 * spacingMultiplier); // Dynamic spacing
      
      // Project description
      if (project.description) {
        pdf.setFontSize(10 + fontSizeBoost); // Dynamic font size
        pdf.setFont(mainFont, 'normal');
        const descLines = pdf.splitTextToSize(project.description, contentWidth);
        pdf.text(descLines, margin, yPos);
        yPos += descLines.length * (3.5 * spacingMultiplier); // Dynamic line spacing
      }
      
      // Technologies
      if (project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0) {
        pdf.setFontSize(9.5 + fontSizeBoost); // Dynamic font size
        pdf.setTextColor(44, 82, 130);
        pdf.setFont(mainFont, 'italic');
        
          const validTechs = project.technologies.filter(tech => tech && typeof tech === 'string');
          if (validTechs.length > 0) {
          const techText = "Technologies: " + validTechs.join(', ');
          const techLines = pdf.splitTextToSize(techText, contentWidth);
          pdf.text(techLines, margin, yPos);
          yPos += techLines.length * (3.5 * spacingMultiplier); // Dynamic line spacing
        }
      }
      
      // Add spacing between projects, but less for last project
      const projectSpacing = index === (resumeData.projects || []).length - 1 ? 3 : 4;
      yPos += Math.round(projectSpacing * spacingMultiplier);
    });
    
    yPos += Math.round(4 * spacingMultiplier); // Dynamic section spacing
    
    // Add extra spacing between major sections when there's lots of space
    if (hasLotsOfSpace) {
      yPos += Math.round(8 * spacingMultiplier);
    }
  }
  
  // SECTION: EDUCATION - Dynamic spacing
  if (hasEducation) {
    checkPageBreak(25); // Reduced minimum space
    
    pdf.setFontSize(14 + fontSizeBoost); // Dynamic font size
    pdf.setTextColor(26, 86, 219);
    pdf.setFont(mainFont, 'bold');
    pdf.text("EDUCATION", margin, yPos);
    
    yPos += Math.round(6 * spacingMultiplier); // Dynamic spacing
    
    (resumeData.education || []).forEach((edu, index) => {
      checkPageBreak(12); // Reduced space for one education entry
      
      // Degree and date
      pdf.setFontSize(12 + fontSizeBoost); // Dynamic font size
      pdf.setTextColor(45, 55, 72);
      pdf.setFont(mainFont, 'bold');
      if (edu.degree) {
        pdf.text(edu.degree, margin, yPos);
      }
      
      if (edu.dates) {
        const datesWidth = pdf.getTextWidth(edu.dates);
        pdf.setFontSize(10 + fontSizeBoost); // Dynamic font size
        pdf.setFont(mainFont, 'normal');
        pdf.text(edu.dates, pageWidth - margin - datesWidth, yPos);
      }
      
      yPos += Math.round(4 * spacingMultiplier); // Dynamic spacing
      
      // School
      pdf.setFontSize(10 + fontSizeBoost); // Dynamic font size
      pdf.setFont(mainFont, 'italic');
      if (edu.school) {
        pdf.text(edu.school, margin, yPos);
      }
      
      // Add spacing between education entries, but less for last entry
      let eduSpacing = index === (resumeData.education || []).length - 1 ? 3 : 4;
      
      // Add extra spacing within education section when there's lots of space
      if (hasLotsOfSpace) {
        eduSpacing += 3;
      }
      
      yPos += Math.round(eduSpacing * spacingMultiplier);
    });
    
    yPos += Math.round(4 * spacingMultiplier); // Dynamic section spacing
  }
  
  // SECTION: CERTIFICATIONS - Dynamic spacing
  if (hasCertifications) {
    const certCount = (resumeData.certifications || []).length;
    checkPageBreak(15 + (certCount * 4)); // Reduced estimate
    
    pdf.setFontSize(14 + fontSizeBoost); // Dynamic font size
    pdf.setTextColor(26, 86, 219);
    pdf.setFont(mainFont, 'bold');
    pdf.text("CERTIFICATIONS", margin, yPos);
    
    yPos += Math.round(5 * spacingMultiplier); // Dynamic spacing
    
    pdf.setFontSize(10 + fontSizeBoost); // Dynamic font size
    pdf.setTextColor(45, 55, 72);
    pdf.setFont(mainFont, 'normal');
    
    (resumeData.certifications || []).forEach((cert, index) => {
      if (!cert || typeof cert !== 'string') return;
      
      checkPageBreak(6); // Reduced space for one certification
      
      pdf.text("•", margin, yPos);
      
      const bulletIndent = margin + 4;
      const bulletWidth = contentWidth - 4;
      
      const lines = pdf.splitTextToSize(cert, bulletWidth);
      if (lines && lines.length > 0) {
        pdf.text(lines, bulletIndent, yPos);
        yPos += lines.length * (3.5 * spacingMultiplier); // Dynamic line spacing
      }
      
      // Dynamic spacing between certifications
      if (index < (resumeData.certifications || []).length - 1) {
        yPos += Math.round(0.5 * spacingMultiplier);
      }
    });
  }
  
  // Add footer to all pages
  for (let page = 1; page <= currentPage; page++) {
    if (page > 1) {
      pdf.setPage(page);
    }
    
    // Footer with generation date and page number
    pdf.setFontSize(8); // Increased by +1
    pdf.setTextColor(150, 150, 150);
      pdf.setFont(mainFont, 'italic');
      
      const currentDate = new Date().toLocaleDateString();
      const footerText = `Resume generated on ${currentDate} · CvPrep.ai`;
      
    pdf.text(footerText, margin, pageHeight - 8); // Moved up slightly
    
    if (currentPage > 1) {
      pdf.text(`Page ${page} of ${currentPage}`, pageWidth - margin - 20, pageHeight - 8);
    }
  }
  
  return pdf;
};