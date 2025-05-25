import jsPDF from "jspdf";
import { ResumeData, ResumeResponse } from "../types";

/**
 * Generates a classic style resume PDF
 */
export const generateClassicTemplate = async (resumeData: ResumeData, resumeResponse: ResumeResponse | null) => {
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
  
  // Use Times New Roman font
  const mainFont = 'times';
  
  // Adjust margins to utilize space better
  const margin = 15; // Increased from 12
  let yPos = 15; // Increased from 10
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (margin * 2);
  
  // Add background color to the entire page
  pdf.setFillColor(252, 252, 253); // Very light gray/blue background
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Count how many significant sections we have to adjust spacing
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
  
  // Calculate extra spacing to add between sections based on how many significant sections we have
  // If we have fewer sections, add more space between them
  const extraSpacing = significantSections <= 2 ? 12 : 
                       significantSections === 3 ? 8 : 
                       significantSections === 4 ? 4 : 2;
  
  // Function to measure total content height to ensure it fits on one page
  const measureTotalContentHeight = () => {
    // Estimate total experience entries (each takes significant space)
    const experienceEntries = (resumeData.work_experience?.length || 0);
    const projectEntries = (resumeData.projects?.length || 0);
    const educationEntries = (resumeData.education?.length || 0);
    
    // Calculate total entries that take significant space
    const totalEntries = experienceEntries + projectEntries + educationEntries;
    
    // Estimate total bullet points
    let totalBullets = 0;
    if (resumeData.work_experience) {
      resumeData.work_experience.forEach(exp => {
        totalBullets += exp.bullets?.length || 0;
      });
    }
    
    // Count total sections
    const totalSections = [
      resumeData.summary ? 1 : 0,
      hasSkills ? 1 : 0,
      hasWorkExperience ? 1 : 0,
      hasProjects ? 1 : 0,
      hasEducation ? 1 : 0,
      hasCertifications ? 1 : 0
    ].reduce((sum, val) => sum + val, 0);
    
    // Return different density classifications
    return {
      totalEntries,
      totalBullets,
      totalSections,
      isHighDensity: totalEntries > 6 || totalBullets > 12 || totalEntries + (totalBullets/3) > 8,
      isVeryDense: totalEntries > 8 || totalBullets > 15 || (totalEntries > 6 && totalBullets > 12) || totalSections >= 6
    };
  };
  
  // Check if we need to compress layout to fit everything
  const contentDensity = measureTotalContentHeight();
  
  // Adjust spacing based on content density
  const densitySpacingFactor = contentDensity.isVeryDense ? 0.6 : 
                              contentDensity.isHighDensity ? 0.8 : 1.0;
  
  // Calculate font scaling based on content density
  const fontScaling = contentDensity.isVeryDense ? 0.9 :
                     contentDensity.isHighDensity ? 0.95 :
                     significantSections <= 2 ? 1.3 : 
                     significantSections === 3 ? 1.2 : 
                     significantSections === 4 ? 1.1 : 1.0;
  
  // Adjust extra spacing based on content density
  const adjustedExtraSpacing = extraSpacing * densitySpacingFactor;
  

  
  // Header with name - increased font size
  pdf.setFontSize(fontScaling * 22);
  pdf.setTextColor(26, 86, 219); // #1a56db - Blue color for headers
  pdf.setFont(mainFont, 'bold');
  pdf.text(userName || "Resume", pageWidth / 2, yPos, { align: 'center' });
  
  // Adjust top spacing based on content density
  yPos += contentDensity.isHighDensity ? 6 : 8 + (significantSections <= 3 ? 3 : 0);
  
  // Contact details with justified text instead of center alignment
  pdf.setFontSize(fontScaling * 10);
  pdf.setTextColor(74, 85, 104); // #4a5568
  pdf.setFont(mainFont, 'normal');
  
  // Create contact parts as separate elements to prevent breaking
  const contactElements = [];
  if (userEmail) contactElements.push({ label: "Email:", value: userEmail });
  if (userPhone) contactElements.push({ label: "Phone:", value: userPhone });
  if (userLocation) contactElements.push({ label: "Location:", value: userLocation.replace(/\n/g, ' ').trim() });
  
  // Calculate how to distribute contact elements across lines
  const maxLineWidth = contentWidth - 5;
  let currentLine: string[] = [];
  const lines: string[][] = [currentLine];
  let currentLineWidth = 0;
  
  // Distribute elements across lines
  contactElements.forEach((element, index) => {
    const elementText = `${element.label} ${element.value}${index < contactElements.length - 1 ? ' | ' : ''}`;
    const elementWidth = pdf.getTextWidth(elementText);
    
    // If adding this element would exceed line width, start a new line
    if (currentLineWidth + elementWidth > maxLineWidth && currentLine.length > 0) {
      currentLine = [];
      lines.push(currentLine);
      currentLineWidth = 0;
    }
    
    currentLine.push(elementText);
    currentLineWidth += elementWidth;
  });
  
  // Render each line of contact information
  lines.forEach(line => {
    pdf.text(line.join(' '), margin, yPos);
    yPos += 4; // Spacing between lines
  });
  
  // Horizontal line
  pdf.setDrawColor(26, 86, 219); // #1a56db
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 5 + (significantSections <= 3 ? 2 : 0); // Add a bit more space after the header if fewer sections
  
  // SECTION: PROFESSIONAL SUMMARY
  if (resumeData.summary) {
    pdf.setFontSize(fontScaling * 14);
    pdf.setTextColor(26, 86, 219); // Blue color for section headers
    pdf.setFont(mainFont, 'bold');
    pdf.text("PROFESSIONAL SUMMARY", margin, yPos);
    
    yPos += 4;
    pdf.setFontSize(fontScaling * 10); 
    pdf.setTextColor(45, 55, 72); // #2d3748
    pdf.setFont(mainFont, 'normal');
    
    // Adjust summary length based on total sections
    const maxSummaryLines = significantSections <= 2 ? 8 : 
                           significantSections === 3 ? 6 : 
                           significantSections === 4 ? 5 : 4;
    
    // Allow for more summary lines if we have fewer sections
    const summaryLines = pdf.splitTextToSize(resumeData.summary, contentWidth);
    const limitedSummary = summaryLines.slice(0, maxSummaryLines);
    pdf.text(limitedSummary, margin, yPos);
    yPos += limitedSummary.length * 4;
    
    yPos += 4 + adjustedExtraSpacing;
  }
  
  // SECTION: SKILLS
  if (hasSkills) {
    pdf.setFontSize(fontScaling * 14);
    pdf.setTextColor(26, 86, 219); // Blue color for section headers
    pdf.setFont(mainFont, 'bold');
    pdf.text("SKILLS", margin, yPos);
    
    yPos += 6;
    
    // Process each skill category in a pill format
    Object.entries(resumeData.skills || {}).forEach(([category, skillList]) => {
      if (!skillList || !skillList.length) return;
      
      const formattedCategory = category
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      pdf.setFontSize(fontScaling * 12);
      pdf.setTextColor(45, 55, 72); // #2d3748
      pdf.setFont(mainFont, 'bold');
      pdf.text(formattedCategory, margin, yPos);
      
      yPos += 5;
      
      // Create pill-style skills
      pdf.setFontSize(fontScaling * 9);
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
          yPos += pillHeight + 1;
        }
        
        // Draw pill background
        pdf.setFillColor(240, 240, 245); // Light gray background
        pdf.roundedRect(xOffset, yPos - 3.5, skillWidth, pillHeight, 1.5, 1.5, 'F');
        
        // Draw skill text
        pdf.setTextColor(74, 85, 104); // #4a5568
        pdf.text(skill, xOffset + pillPadding, yPos);
        
        xOffset += skillWidth + pillMargin;
      });
      
      yPos += pillHeight + 4;
    });
    
    yPos += 4 + adjustedExtraSpacing;
  }
  
  // Safety check function to detect if we're near bottom of page
  const isNearPageBottom = (yPosition: number, buffer: number = 30) => {
    return yPosition >= pageHeight - buffer;
  };

  // Keep track of remaining sections to render for prioritization
  const sectionsToRender = {
    workExperience: hasWorkExperience,
    education: hasEducation,
    projects: hasProjects,
    certifications: hasCertifications
  };
  
  // Improved compression factor calculation
  const getCompressionFactor = (resumeData: ResumeData, pageHeight: number): number => {
    // Only compress if we have a lot of content
    if (!resumeData) return 1;
    
    // Count sections present in the resume
    const sectionCount = [
      !!resumeData.summary,
      !!resumeData.skills && Object.keys(resumeData.skills).length > 0,
      !!resumeData.work_experience && resumeData.work_experience.length > 0,
      !!resumeData.projects && resumeData.projects.length > 0,
      !!resumeData.education && resumeData.education.length > 0,
      !!resumeData.certifications && resumeData.certifications.length > 0
    ].filter(Boolean).length;
    
    // Calculate estimated heights for each section
    const headerHeight = 45; // Name, title, contact info - increased from 40
    const summaryHeight = resumeData.summary ? 70 : 0; // Increased from 60
    const skillsHeight = resumeData.skills && Object.keys(resumeData.skills).length > 0 ? 50 : 0; // Increased from 40
    
    // Work experience height estimation
    const workEntryBaseHeight = 30; // Company, title, dates - increased from 25
    const workBulletHeight = 18; // Per bullet point - increased from 15
    const workExperienceHeight = resumeData.work_experience?.length 
      ? 35 + resumeData.work_experience.reduce((height, work) => {
          const bulletHeight = (work.bullets?.length || 0) * workBulletHeight;
          return height + workEntryBaseHeight + bulletHeight;
        }, 0)
      : 0;
    
    // Education height estimation
    const educationHeight = resumeData.education?.length 
      ? 35 + (resumeData.education.length * 45) // Increased from 30 + (length * 40)
      : 0;
    
    // Projects height estimation - significantly increased for better spacing
    const projectEntryBaseHeight = 35; // Project name - increased from 25
    const projectDescriptionHeight = 40; // Description takes space - increased from 30
    const projectsHeight = resumeData.projects?.length
      ? 35 + resumeData.projects.length * (projectEntryBaseHeight + projectDescriptionHeight)
      : 0;
    
    // Certifications height estimation
    const certificationsHeight = resumeData.certifications?.length
      ? 35 + (resumeData.certifications.length * 30) // Increased from 30 + (length * 25)
      : 0;
    
    // Calculate total estimated height
    const totalEstimatedHeight = 
      headerHeight + 
      summaryHeight + 
      skillsHeight + 
      workExperienceHeight + 
      educationHeight + 
      projectsHeight + 
      certificationsHeight;
    
    // Calculate how much we need to compress
    const heightRatio = totalEstimatedHeight / (pageHeight - 40); // Leave some margin
    

    
    // Progressive compression based on content amount and section count
    if (sectionCount >= 6 || heightRatio > 1.4) {
      // Extreme compression for resumes with all sections
      return 0.7;
    } else if (sectionCount >= 5 || heightRatio > 1.25) {
      // Heavy compression
      return 0.8;
    } else if (sectionCount >= 4 || heightRatio > 1.1) {
      // Medium compression
      return 0.9;
    } else if (heightRatio > 1) {
      // Light compression
      return 0.95;
    }
    
    // No compression needed
    return 1;
  };
  
  // Apply additional vertical compression if needed
  const compressionFactor = getCompressionFactor(resumeData, pageHeight);
  
  // Combine compression with density spacing
  const finalSpacingFactor = densitySpacingFactor * compressionFactor;
  
  // SECTION: WORK EXPERIENCE
  if (hasWorkExperience) {
    pdf.setFontSize(fontScaling * 14);
    pdf.setTextColor(26, 86, 219); // Blue color for section headers
    pdf.setFont(mainFont, 'bold');
    pdf.text("WORK EXPERIENCE", margin, yPos);
    
    yPos += 4;
    
    // Use finalSpacingFactor instead of densitySpacingFactor
    yPos += contentDensity.isVeryDense ? 4 * finalSpacingFactor : 
            contentDensity.isHighDensity ? 5 * finalSpacingFactor : 6 * finalSpacingFactor;
    
    // Create a light gray background for each job
    (resumeData.work_experience || []).forEach((exp, expIndex) => {
      // Calculate height needed for this job entry
      const titleHeight = contentDensity.isHighDensity ? 4 : 5;
      const companyHeight = contentDensity.isHighDensity ? 4 : 5;
      const hasBullets = (exp.bullets && exp.bullets.length > 0) || (exp.accomplishments && exp.accomplishments.length > 0);
      
      // Adjust max bullets based on content density and total experiences
      const experienceCount = resumeData.work_experience?.length || 0;
      const maxBullets = contentDensity.isVeryDense ? 
        (experienceCount > 3 ? 2 : 3) :
        contentDensity.isHighDensity ? 
          (experienceCount > 2 ? 3 : 4) :
          (!hasProjects && !hasCertifications ? 8 :
          significantSections <= 3 ? 6 :
          significantSections === 4 ? 5 : 4);
      
      // Adjust bullet height based on content density
      const bulletPoints = exp.bullets || exp.accomplishments || [];
      const limitedBullets = hasBullets ? 
        bulletPoints.slice(0, maxBullets) : [];
      
      const bulletHeight = limitedBullets.length * (
        contentDensity.isVeryDense ? 3.5 :
        contentDensity.isHighDensity ? 4 : 5
      );
      
      // Adjust job padding based on content density
      const jobPadding = contentDensity.isVeryDense ? 4 :
        contentDensity.isHighDensity ? 
          (significantSections <= 3 ? 8 : 6) : 
          (significantSections <= 3 ? 12 : 8);
      
      const jobHeight = titleHeight + companyHeight + bulletHeight + jobPadding;
      
      // Draw background rectangle with padding for visual separation
      pdf.setFillColor(248, 250, 252); // Very light gray
      const rectYPos = yPos - (contentDensity.isHighDensity ? 2 : 3);
      pdf.rect(margin - 2, rectYPos, contentWidth + 4, jobHeight, 'F');
      
      // Job title and dates on the same line
      pdf.setFontSize(fontScaling * 12);
      pdf.setTextColor(45, 55, 72); // #2d3748
      pdf.setFont(mainFont, 'bold');
      if (exp.title || exp.role) {
        pdf.text(exp.title || exp.role || "Position", margin, yPos);
      } else {
        pdf.text("Position", margin, yPos); // Fallback text
      }
      
      const dateText = exp.dates || exp.date_range || "";
      const datesWidth = pdf.getTextWidth(dateText);
      pdf.setFontSize(fontScaling * 10);
      pdf.setFont(mainFont, 'normal');
      if (dateText) {
        pdf.text(dateText, pageWidth - margin - datesWidth, yPos);
      }
      
      // Adjust spacing after title based on content density
      yPos += contentDensity.isHighDensity ? 4 : 6;
      
      // Company and location
      pdf.setFontSize(fontScaling * 10);
      pdf.setTextColor(74, 85, 104); // #4a5568
      pdf.setFont(mainFont, 'italic');
      if (exp.company) {
        pdf.text(`${exp.company}${exp.location ? ` • ${exp.location}` : ''}`, margin, yPos);
      }
      
      // Adjust spacing after company based on content density
      yPos += contentDensity.isHighDensity ? 4 : 6;
      
      // If no bullets, add extra space
      if (!hasBullets) {
        yPos += contentDensity.isHighDensity ? 2 : 4;
      }
      
      // Bullet points with better spacing
      if (hasBullets) {
        pdf.setFontSize(fontScaling * 10);
        pdf.setTextColor(45, 55, 72); // #2d3748
        pdf.setFont(mainFont, 'normal');
        
        // Get bullets from either bullets or accomplishments array
        const bulletPoints = exp.bullets || exp.accomplishments || [];
        const limitedBullets = bulletPoints.slice(0, maxBullets);
        
        limitedBullets.forEach((bullet, i) => {
          // Add space between bullet points for better readability
          // Only add extra space if not in high density mode
          if (i > 0 && !contentDensity.isHighDensity) {
            yPos += 1;
          }
          
          // Skip empty or undefined bullets
          if (!bullet) return;
          
          // Use proper bullet character and indentation
          pdf.text("•", margin, yPos);
          
          // Calculate proper indentation for wrapped text
          const bulletIndent = margin + 4;
          const bulletWidth = contentWidth - 5;
          
          // Adjust max lines based on content density
          const maxLines = contentDensity.isHighDensity ? 
            (experienceCount > 3 ? 1 : 2) : 
            (significantSections <= 3 ? 3 : 2);
          
          // Ensure bullet is a string
          const bulletText = typeof bullet === 'string' ? bullet : String(bullet || '');
          const lines = pdf.splitTextToSize(bulletText, bulletWidth).slice(0, maxLines);
          
          // Only render if we have valid lines
          if (lines && lines.length > 0) {
            pdf.text(lines, bulletIndent, yPos);
            // Adjust line spacing based on content density
            yPos += lines.length * (contentDensity.isHighDensity ? 3.5 : 4);
          } else {
            // Add minimal spacing if no content
            yPos += contentDensity.isHighDensity ? 3.5 : 4;
          }
        });
      }
      
      // Adjust spacing between jobs based on content density
      if (expIndex < experienceCount - 1) {
        yPos += contentDensity.isHighDensity ? 
          (experienceCount <= 2 ? 6 : 4) : 
          (experienceCount <= 2 ? 10 : 8);
      }
    });
    
    // Adjust spacing after section based on content density
    yPos += contentDensity.isHighDensity ? 6 : 8 + adjustedExtraSpacing;
    sectionsToRender.workExperience = false;
  }
  
  // SECTION: PROJECTS
  if (hasProjects) {
    pdf.setFontSize(fontScaling * 14);
    pdf.setTextColor(26, 86, 219); // Blue color for section headers
    pdf.setFont(mainFont, 'bold');
    pdf.text("PROJECTS", margin, yPos);
    
    yPos += 8; // Increased from 5mm to 8mm for better spacing
    
    // Use all projects instead of limiting them
    (resumeData.projects || []).forEach((project, index) => {
      // Project title with increased font size
      pdf.setFontSize(fontScaling * 13); // Increased from 12
      pdf.setTextColor(45, 55, 72); // #2d3748
      pdf.setFont(mainFont, 'bold');
      if (project.title) {
        pdf.text(project.title, margin, yPos);
      } else {
        pdf.text("Project", margin, yPos); // Fallback text
      }
      
      yPos += contentDensity.isHighDensity ? 5 : 6; // Increased spacing after project title
      
      // Project description with increased font size and more allowed lines
      pdf.setFontSize(fontScaling * 11); // Increased from 10
      pdf.setFont(mainFont, 'normal');
      const maxDescLines = contentDensity.isHighDensity ? 2 : 3; // Increased max lines
      if (project.description) {
        const descLines = pdf.splitTextToSize(project.description, contentWidth).slice(0, maxDescLines);
        pdf.text(descLines, margin, yPos);
        yPos += descLines.length * (contentDensity.isHighDensity ? 4 : 5); // Increased line spacing
      } else {
        yPos += contentDensity.isHighDensity ? 4 : 5; // Add spacing even without description
      }
      
      // Technologies if available (on same line if possible)
      if (project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0) {
        pdf.setFontSize(fontScaling * 10); // Increased from 9
        pdf.setTextColor(44, 82, 130); // #2c5282
        pdf.setFont(mainFont, 'italic');
        
        // Add technologies with proper indentation
        let techText = "Tech: ";
        
        // Safely join technologies array or handle string
        if (Array.isArray(project.technologies)) {
          // Filter out any non-string or empty values
          const validTechs = project.technologies.filter(tech => tech && typeof tech === 'string');
          if (validTechs.length > 0) {
            techText += validTechs.join(', ');
          } else {
            techText += "Various technologies";
          }
        } else if (typeof project.technologies === 'string') {
          techText = "Tech: " + project.technologies;
        } else {
          techText = "Tech: Various technologies";
        }
        
        const techLines = pdf.splitTextToSize(techText, contentWidth).slice(0, 1);
        if (techLines && techLines.length > 0) {
          pdf.text(techLines, margin, yPos);
        }
        
        yPos += contentDensity.isHighDensity ? 4 : 5; // Increased spacing after technologies
      } else {
        yPos += 3; // Increased spacing if no technologies
      }
      
      // Add more spacing between projects
      if (index < (resumeData.projects?.length || 0) - 1) {
        yPos += contentDensity.isHighDensity ? 6 : 9; // Significantly increased spacing between projects
      }
    });
    
    yPos += 6; // Increased space after projects section
    sectionsToRender.projects = false;
  }
  
  // SECTION: EDUCATION
  if (hasEducation) {
    pdf.setFontSize(fontScaling * 14);
    pdf.setTextColor(26, 86, 219); // Blue color for section headers
    pdf.setFont(mainFont, 'bold');
    pdf.text("EDUCATION", margin, yPos);
    
    yPos += contentDensity.isHighDensity ? 4 : 5;
    
    (resumeData.education || []).forEach((edu, index) => {
      // Skip remaining education if we're near the bottom
      if (isNearPageBottom(yPos, 15) && index > 0) {
        return;
      }
      
      // Degree and date on same line
      pdf.setFontSize(fontScaling * 12);
      pdf.setTextColor(45, 55, 72); // #2d3748
      pdf.setFont(mainFont, 'bold');
      if (edu.degree) {
        pdf.text(edu.degree, margin, yPos);
      } else {
        pdf.text("Degree", margin, yPos); // Fallback text
      }
      
      const datesWidth = pdf.getTextWidth(edu.dates || "");
      pdf.setFontSize(fontScaling * 10);
      pdf.setFont(mainFont, 'normal');
      if (edu.dates) {
        pdf.text(edu.dates, pageWidth - margin - datesWidth, yPos);
      }
      
      yPos += contentDensity.isHighDensity ? 3 : 4;
      
      // School and location on same line
      pdf.setFontSize(fontScaling * 10);
      pdf.setFont(mainFont, 'italic');
      if (edu.school) {
        pdf.text(edu.school, margin, yPos);
      }
      
      if (edu.location) {
        const locationWidth = pdf.getTextWidth(edu.location);
        pdf.setTextColor(74, 85, 104); // #4a5568
        pdf.text(edu.location, pageWidth - margin - locationWidth, yPos);
      }
      
      // Adjust spacing between education entries based on content density
      const educationCount = resumeData.education?.length || 0;
      yPos += (index < educationCount - 1) ? 
        (contentDensity.isVeryDense ? 3 :
        contentDensity.isHighDensity ? 5 : 8) : 
        (contentDensity.isVeryDense ? 3 :
        contentDensity.isHighDensity ? 4 : 6);
    });
    
    yPos += contentDensity.isVeryDense ? 3 :
            contentDensity.isHighDensity ? 5 : 8;
  }
  
  // SECTION: CERTIFICATIONS
  if (hasCertifications) {
    pdf.setFontSize(fontScaling * 14);
    pdf.setTextColor(26, 86, 219); // Blue color for section headers
    pdf.setFont(mainFont, 'bold');
    pdf.text("CERTIFICATIONS", margin, yPos);
    
    yPos += 6;
    
    // Display certifications in a single line if possible
    pdf.setFontSize(fontScaling * 10);
    pdf.setTextColor(45, 55, 72); // #2d3748
    pdf.setFont(mainFont, 'normal');
    
    // Show all certifications instead of limiting based on space
    (resumeData.certifications || []).forEach((cert) => {
      // Skip empty or invalid certifications
      if (!cert || typeof cert !== 'string') return;
      
      pdf.text("•", margin, yPos);
      
      // Calculate proper indentation for wrapped text
      const bulletIndent = margin + 4;
      const bulletWidth = contentWidth - 4;
      
      // Add the certification text with proper wrapping
      const lines = pdf.splitTextToSize(cert, bulletWidth).slice(0, 1);
      if (lines && lines.length > 0) {
        pdf.text(lines, bulletIndent, yPos);
      }
      
      // Move position based on number of lines
      yPos += 4;
    });
    
    yPos += 6;
  }
  
  // Calculate available space - how much is left to the bottom of the page
  const getAvailableSpace = () => {
    return pageHeight - yPos - margin;
  };
  
  // Add extra spacing after education if it's the last section and there's too much space
  if (hasEducation && (!hasCertifications || yPos + 50 < pageHeight)) {
    // If education is close to the last section, add placeholder text to fill space
    const availableSpace = getAvailableSpace();
    
    if (availableSpace > 40) {
      // Add faded footer text with the document generation date
      yPos = pageHeight - 25; // Position near bottom
      pdf.setFontSize(fontScaling * 8);
      pdf.setTextColor(150, 150, 150); // Light gray color
      pdf.setFont(mainFont, 'italic');
      
      const currentDate = new Date().toLocaleDateString();
      const footerText = `Resume generated on ${currentDate} · CareerPal.ai`;
      
      // Center the text
      const textWidth = pdf.getTextWidth(footerText);
      pdf.text(footerText, (pageWidth - textWidth) / 2, yPos);
    }
  }
  
  return pdf;
}; 