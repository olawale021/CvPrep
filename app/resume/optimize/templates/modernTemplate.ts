import jsPDF from "jspdf";
import { ResumeData, ResumeResponse } from "../types";

/**
 * Generates a modern style resume PDF
 */
export const generateModernTemplate = async (resumeData: ResumeData, resumeResponse: ResumeResponse | null) => {
  // Extract contact details from the full response
  const contactDetails = resumeResponse?.contact_details || {};
  const userName = contactDetails.name || "";
  const userEmail = contactDetails.email || "";
  const userPhone = contactDetails.phone_number || "";
  const userLocation = contactDetails.location || "";
  
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
  pdf.text(userName || "Resume", pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 8;
  
  // Contact details centered
  pdf.setFontSize(fontScaling * 9);
  pdf.setTextColor(74, 85, 104); // Gray
  pdf.setFont(mainFont, 'normal');
  
  // Modern contact details display as horizontal line
  const contactParts = [];
  if (userEmail) contactParts.push(userEmail);
  if (userPhone) contactParts.push(userPhone);
  if (userLocation) contactParts.push(userLocation.replace(/\n/g, ' ').trim());
  
  const contactText = contactParts.join(' | ');
  pdf.text(contactText, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  
  // Side column elements start position
  const sideYPos = yPos;
  
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
    pdf.setFontSize(fontScaling * 12);
    pdf.setTextColor(45, 55, 72); // Dark gray
    pdf.setFont(mainFont, 'bold');
    pdf.text("WORK EXPERIENCE", mainColumnStart, yPos);
    
    pdf.setDrawColor(74, 85, 104);
    pdf.setLineWidth(0.3);
    pdf.line(mainColumnStart, yPos + 1, pageWidth - margin, yPos + 1);
    
    yPos += 6;
    
    (resumeData.work_experience || []).forEach((exp, index) => {
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
        
        // Limit bullet points based on density
        const maxBullets = contentDensity.isVeryDense ? 2 : 
                         contentDensity.isHighDensity ? 3 : 4;
        
        // Get bullets from either bullets or accomplishments array
        const bulletPoints = exp.bullets || exp.accomplishments || [];
        const limitedBullets = bulletPoints.slice(0, maxBullets);
        
        limitedBullets.forEach((bullet) => {
          // Skip empty bullets
          if (!bullet) return;
          
          // Use bullet symbol
          pdf.text("•", mainColumnStart, yPos);
          
          // Indent text
          const bulletIndent = mainColumnStart + 4;
          const maxWidth = mainColumnWidth - 4;
          
          // Ensure bullet is a string
          const bulletText = typeof bullet === 'string' ? bullet : String(bullet || '');
          
          // Wrap text as needed
          const lines = pdf.splitTextToSize(bulletText, maxWidth).slice(0, 2);
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
    pdf.setFontSize(fontScaling * 12);
    pdf.setTextColor(45, 55, 72);
    pdf.setFont(mainFont, 'bold');
    pdf.text("PROJECTS", mainColumnStart, yPos);
    
    pdf.setDrawColor(74, 85, 104);
    pdf.setLineWidth(0.3);
    pdf.line(mainColumnStart, yPos + 1, pageWidth - margin, yPos + 1);
    
    yPos += 6;
    
    (resumeData.projects || []).forEach((project, index) => {
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
  
  // SIDE COLUMN
  // Reset to side column top
  let sideColYPos = sideYPos;
  
  // Skills Section in side column
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
  
  // Education in side column
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
  }
  
  // Certifications in side column if space allows
  if (hasCertifications) {
    // First check if we have enough space in the side column
    if (sideColYPos > pageHeight - 40) {
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
    } else {
      // Enough space in side column
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

  // Add footer with generation date
  const currentDate = new Date().toLocaleDateString();
  pdf.setFontSize(7);
  pdf.setTextColor(150, 150, 150);
  pdf.setFont(mainFont, 'italic');
  const footerText = `Resume generated on ${currentDate} · CareerPal.ai`;
  const footerWidth = pdf.getTextWidth(footerText);
  pdf.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 10);
  
  return pdf;
}; 