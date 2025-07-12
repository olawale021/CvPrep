import { AlignmentType, Document, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { ResumeData, ResumeResponse } from "../../types";

/**
 * Generates a modern style resume Word document with side column layout
 */
export const generateModernWordTemplate = (resumeData: ResumeData, resumeResponse: ResumeResponse | null): Document => {
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
    
    // Extract phone
    const phoneMatch = text.match(/(\+?\d{2,3}[\s-]?\d{3,4}[\s-]?\d{3,4}[\s-]?\d{3,4}|\d{5}\s?\d{6})/);
    if (phoneMatch) {
      extractedPhone = phoneMatch[1];
    }
    
    // Extract location
    const locationMatch = text.match(/\*\*.*?\*\*\s*\n(.*?)\s*\|/);
    if (locationMatch) {
      extractedLocation = locationMatch[1].trim();
    }
  }

  // Prepare contact information
  const displayName = extractedName || userName || resumeData.contact_details?.name || "Professional Resume";
  const email = extractedEmail || userEmail || resumeData.contact_details?.email || "";
  const phone = extractedPhone || userPhone || resumeData.contact_details?.phone || "";
  const location = extractedLocation || userLocation || resumeData.contact_details?.location || "";

  // Build document children
  const children: (Paragraph | Table)[] = [];

  // HEADER SECTION - Full width
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: displayName,
          bold: true,
          size: 36,
          font: "Calibri",
          color: "2D3748", // Dark gray
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Contact details
  const contactParts = [];
  if (location) contactParts.push(location.replace(/\n/g, ' ').trim());
  if (email) contactParts.push(email);
  if (phone) contactParts.push(phone);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactParts.join(' • '),
            size: 20,
            font: "Calibri",
            color: "4A5568", // Gray
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
  }

  // Create two-column layout using table
  const hasSkills = resumeData.skills && Object.keys(resumeData.skills).length > 0;
  const hasEducation = resumeData.education && resumeData.education.length > 0;
  const hasCertifications = resumeData.certifications && resumeData.certifications.length > 0;
  
  // Side column content (Skills, Education, Certifications)
  const sideColumnContent: Paragraph[] = [];
  
  // SKILLS SECTION (Side column)
  if (hasSkills) {
    sideColumnContent.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "SKILLS",
            bold: true,
            size: 20,
            font: "Calibri",
            color: "2D3748",
          }),
        ],
        spacing: { after: 150 },
      })
    );

    Object.entries(resumeData.skills || {}).forEach(([category, skillList]) => {
      if (!skillList || !skillList.length) return;

      const formattedCategory = category
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      sideColumnContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: formattedCategory,
              bold: true,
              size: 16,
              font: "Calibri",
              color: "2D3748",
            }),
          ],
          spacing: { after: 80 },
        })
      );

      (skillList as string[]).forEach((skill) => {
        sideColumnContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `• ${skill}`,
                size: 14,
                font: "Calibri",
                color: "4A5568",
              }),
            ],
            spacing: { after: 60 },
          })
        );
      });

      sideColumnContent.push(new Paragraph({ spacing: { after: 150 } }));
    });
  }

  // EDUCATION SECTION (Side column)
  if (hasEducation) {
    sideColumnContent.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "EDUCATION",
            bold: true,
            size: 20,
            font: "Calibri",
            color: "2D3748",
          }),
        ],
        spacing: { after: 150 },
      })
    );

    resumeData.education!.forEach((edu) => {
      sideColumnContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.degree,
              bold: true,
              size: 16,
              font: "Calibri",
              color: "2D3748",
            }),
          ],
          spacing: { after: 60 },
        })
      );

      sideColumnContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.school,
              size: 14,
              font: "Calibri",
              color: "4A5568",
            }),
          ],
          spacing: { after: 60 },
        })
      );

      if (edu.dates) {
        sideColumnContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: edu.dates,
                italics: true,
                size: 14,
                font: "Calibri",
                color: "4A5568",
              }),
            ],
            spacing: { after: 150 },
          })
        );
      }
    });
  }

  // CERTIFICATIONS SECTION (Side column)
  if (hasCertifications) {
    sideColumnContent.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "CERTIFICATIONS",
            bold: true,
            size: 20,
            font: "Calibri",
            color: "2D3748",
          }),
        ],
        spacing: { after: 150 },
      })
    );

    resumeData.certifications!.forEach((cert) => {
      sideColumnContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${cert}`,
              size: 14,
              font: "Calibri",
              color: "4A5568",
            }),
          ],
          spacing: { after: 80 },
        })
      );
    });
  }

  // Main column content (Summary, Work Experience, Projects)
  const mainColumnContent: Paragraph[] = [];

  // SUMMARY SECTION (Main column)
  if (resumeData.summary) {
    mainColumnContent.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "PROFESSIONAL SUMMARY",
            bold: true,
            size: 22,
            font: "Calibri",
            color: "2D3748",
          }),
        ],
        spacing: { after: 150 },
      })
    );

    mainColumnContent.push(
      new Paragraph({
        children: [
          new TextRun({
            text: resumeData.summary,
            size: 18,
            font: "Calibri",
            color: "4A5568",
          }),
        ],
        spacing: { after: 300 },
      })
    );
  }

  // WORK EXPERIENCE SECTION (Main column)
  if (resumeData.work_experience && resumeData.work_experience.length > 0) {
    mainColumnContent.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "WORK EXPERIENCE",
            bold: true,
            size: 22,
            font: "Calibri",
            color: "2D3748",
          }),
        ],
        spacing: { after: 150 },
      })
    );

    resumeData.work_experience.forEach((exp, index) => {
      // Job title and company
      mainColumnContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${exp.title || exp.role || 'Position'}`,
              bold: true,
              size: 20,
              font: "Calibri",
              color: "2D3748",
            }),
          ],
          spacing: { after: 60 },
        })
      );

      mainColumnContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: exp.company,
              size: 18,
              font: "Calibri",
              color: "4A5568",
            }),
          ],
          spacing: { after: 60 },
        })
      );

      // Dates and location
      const dateLocation = [];
      if (exp.dates || exp.date_range) dateLocation.push(exp.dates || exp.date_range);
      if (exp.location) dateLocation.push(exp.location);

      if (dateLocation.length > 0) {
        mainColumnContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: dateLocation.join(' | '),
                italics: true,
                size: 16,
                font: "Calibri",
                color: "4A5568",
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }

      // Bullets/accomplishments
      const bulletPoints = exp.bullets || exp.accomplishments || [];
      bulletPoints.forEach((bullet) => {
        if (bullet) {
          mainColumnContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${bullet}`,
                  size: 16,
                  font: "Calibri",
                  color: "4A5568",
                }),
              ],
              spacing: { after: 80 },
            })
          );
        }
      });

      // Add spacing between experiences
      if (index < resumeData.work_experience!.length - 1) {
        mainColumnContent.push(new Paragraph({ spacing: { after: 250 } }));
      }
    });

    mainColumnContent.push(new Paragraph({ spacing: { after: 300 } }));
  }

  // PROJECTS SECTION (Main column)
  if (resumeData.projects && resumeData.projects.length > 0) {
    mainColumnContent.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "PROJECTS",
            bold: true,
            size: 22,
            font: "Calibri",
            color: "2D3748",
          }),
        ],
        spacing: { after: 150 },
      })
    );

    resumeData.projects.forEach((project, index) => {
      mainColumnContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: project.title,
              bold: true,
              size: 20,
              font: "Calibri",
              color: "2D3748",
            }),
          ],
          spacing: { after: 80 },
        })
      );

      if (project.description) {
        mainColumnContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: project.description,
                size: 16,
                font: "Calibri",
                color: "4A5568",
              }),
            ],
            spacing: { after: 80 },
          })
        );
      }

      if (project.technologies && project.technologies.length > 0) {
        mainColumnContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Technologies: `,
                bold: true,
                size: 16,
                font: "Calibri",
                color: "4A5568",
              }),
              new TextRun({
                text: project.technologies.join(', '),
                size: 16,
                font: "Calibri",
                color: "4A5568",
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }

      if (index < (resumeData.projects?.length || 0) - 1) {
        mainColumnContent.push(new Paragraph({ spacing: { after: 200 } }));
      }
    });
  }

  // Create two-column layout table
  if (sideColumnContent.length > 0 && mainColumnContent.length > 0) {
    const table = new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: sideColumnContent,
              width: {
                size: 35,
                type: WidthType.PERCENTAGE,
              },
              shading: {
                type: ShadingType.SOLID,
                color: "F0F2F6", // Light gray background for side column
              },
              margins: {
                top: 200,
                bottom: 200,
                left: 200,
                right: 200,
              },
            }),
            new TableCell({
              children: mainColumnContent,
              width: {
                size: 65,
                type: WidthType.PERCENTAGE,
              },
              margins: {
                top: 200,
                bottom: 200,
                left: 200,
                right: 200,
              },
            }),
          ],
        }),
      ],
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
    });

    children.push(table);
  } else if (mainColumnContent.length > 0) {
    // If no side column content, just add main content
    children.push(...mainColumnContent);
  }

  // Create and return the document
  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,    // 0.5 inch
              right: 720,  // 0.5 inch
              bottom: 720, // 0.5 inch
              left: 720,   // 0.5 inch
            },
          },
        },
        children: children,
      },
    ],
  });
}; 