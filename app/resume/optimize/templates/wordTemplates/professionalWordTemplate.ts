import { AlignmentType, Document, Paragraph, TextRun } from "docx";
import { ResumeData, ResumeResponse } from "../../types";

/**
 * Generates a professional style resume Word document with clean formatting
 */
export const generateProfessionalWordTemplate = (resumeData: ResumeData, resumeResponse: ResumeResponse | null): Document => {
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
  
  // Try to extract contact info from optimized_text, original data, or anywhere else
  let extractedName = "";
  let extractedEmail = "";
  let extractedPhone = "";
  let extractedLocation = "";
  
  const resumeDataWithText = resumeData as ResumeData & { optimized_text?: string };
  
  // Try to extract from optimized_text first
  if (resumeDataWithText.optimized_text) {
    const text = resumeDataWithText.optimized_text;
    
    // Extract name - try multiple patterns
    const namePatterns = [
      /\*\*(.*?)\*\*/,  // **Name**
      /^([A-Z][a-z]+ [A-Z][a-z]+)/m,  // First line starting with Name
      /Name:?\s*([A-Z][a-z]+ [A-Z][a-z]+)/i,  // Name: field
    ];
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].trim()) {
        extractedName = match[1].trim();
        break;
      }
    }
    
    // Extract email
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      extractedEmail = emailMatch[1];
    }
    
    // Extract phone - more flexible patterns
    const phonePatterns = [
      /(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/,  // US format
      /(\+?\d{2,3}[\s-]?\d{3,4}[\s-]?\d{3,4}[\s-]?\d{3,4})/,  // International
      /(\d{5}\s?\d{6})/,  // Some other format
      /Phone:?\s*([+\d\s\-\(\)\.]+)/i,  // Phone: field
    ];
    
    for (const pattern of phonePatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].trim()) {
        extractedPhone = match[1].trim();
        break;
      }
    }
    
    // Extract location - try multiple patterns
    const locationPatterns = [
      /\*\*.*?\*\*\s*\n(.*?)\s*\|/,  // Original pattern
      /Location:?\s*([A-Z][a-z]+(?:,\s*[A-Z]{2})?)/i,  // Location: field
      /Address:?\s*([A-Z][a-z]+(?:,\s*[A-Z]{2})?)/i,  // Address: field
      /([A-Z][a-z]+,\s*[A-Z]{2})/,  // City, State format
    ];
    
    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].trim()) {
        extractedLocation = match[1].trim();
        break;
      }
    }
  }
  
  // Try to extract from original data in resumeResponse
  if (resumeResponse?.original) {
    const original = resumeResponse.original as unknown as Record<string, unknown>;
    const originalContacts = original.contact_details as Record<string, unknown> | undefined;
    if (originalContacts) {
      if (!extractedName && originalContacts.name) extractedName = String(originalContacts.name);
      if (!extractedEmail && originalContacts.email) extractedEmail = String(originalContacts.email);
      if (!extractedPhone && (originalContacts.phone || originalContacts.phone_number)) {
        extractedPhone = String(originalContacts.phone || originalContacts.phone_number);
      }
      if (!extractedLocation && originalContacts.location) extractedLocation = String(originalContacts.location);
    }
  }

  // Prepare contact information
  const displayName = extractedName || userName || resumeData.contact_details?.name || "Professional Resume";
  const email = extractedEmail || userEmail || resumeData.contact_details?.email || "";
  const phone = extractedPhone || userPhone || resumeData.contact_details?.phone || "";
  const location = extractedLocation || userLocation || resumeData.contact_details?.location || "";

  // Build document children
  const children: Paragraph[] = [];

  // HEADER SECTION
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: displayName,
          bold: true,
          size: 32,
          font: "Calibri",
          color: "1E1E1E", // Dark color
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Contact details - single line, centered
  const contactParts = [];
  if (location) contactParts.push(location.replace(/\n/g, ' ').trim());
  if (email) contactParts.push(email);
  if (phone) contactParts.push(phone);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactParts.join(' | '),
            size: 20,
            font: "Calibri",
            color: "505050", // Gray
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      })
    );
  }

  // Helper function to create section header with line
  const createSectionHeader = (title: string) => {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 24,
            font: "Calibri",
            color: "1E1E1E",
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "________________________________________________",
            size: 12,
            font: "Calibri",
            color: "C8C8C8", // Light gray line
          }),
        ],
        spacing: { after: 200 },
      }),
    ];
  };

  // SUMMARY SECTION
  if (resumeData.summary) {
    children.push(...createSectionHeader("PROFESSIONAL SUMMARY"));

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: resumeData.summary,
            size: 20,
            font: "Calibri",
            color: "323232",
          }),
        ],
        spacing: { after: 300 },
      })
    );
  }

  // SKILLS SECTION
  if (resumeData.skills && Object.keys(resumeData.skills).length > 0) {
    children.push(...createSectionHeader("SKILLS"));

    Object.entries(resumeData.skills).forEach(([category, skillList]) => {
      if (!skillList || !skillList.length) return;

      const formattedCategory = category
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${formattedCategory}: `,
              bold: true,
              size: 18,
              font: "Calibri",
              color: "323232",
            }),
            new TextRun({
              text: (skillList as string[]).join(', '),
              size: 18,
              font: "Calibri",
              color: "323232",
            }),
          ],
          spacing: { after: 100 },
        })
      );
    });

    children.push(new Paragraph({ spacing: { after: 200 } }));
  }

  // WORK EXPERIENCE SECTION
  if (resumeData.work_experience && resumeData.work_experience.length > 0) {
    children.push(...createSectionHeader("WORK EXPERIENCE"));

    resumeData.work_experience.forEach((exp, index) => {
      // Job title and company
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${exp.title || exp.role || 'Position'}`,
              bold: true,
              size: 22,
              font: "Calibri",
              color: "1E1E1E",
            }),
          ],
          spacing: { after: 60 },
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: exp.company,
              size: 20,
              font: "Calibri",
              color: "505050",
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
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: dateLocation.join(' | '),
                italics: true,
                size: 18,
                font: "Calibri",
                color: "505050",
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
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${bullet}`,
                  size: 18,
                  font: "Calibri",
                  color: "323232",
                }),
              ],
              spacing: { after: 80 },
            })
          );
        }
      });

      // Add spacing between experiences
      if (index < resumeData.work_experience!.length - 1) {
        children.push(new Paragraph({ spacing: { after: 250 } }));
      }
    });

    children.push(new Paragraph({ spacing: { after: 200 } }));
  }

  // PROJECTS SECTION
  if (resumeData.projects && resumeData.projects.length > 0) {
    children.push(...createSectionHeader("PROJECTS"));

    resumeData.projects.forEach((project, index) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: project.title,
              bold: true,
              size: 22,
              font: "Calibri",
              color: "1E1E1E",
            }),
          ],
          spacing: { after: 80 },
        })
      );

      if (project.description) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: project.description,
                size: 18,
                font: "Calibri",
                color: "323232",
              }),
            ],
            spacing: { after: 80 },
          })
        );
      }

      if (project.technologies && project.technologies.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Technologies: `,
                bold: true,
                size: 18,
                font: "Calibri",
                color: "323232",
              }),
              new TextRun({
                text: project.technologies.join(', '),
                size: 18,
                font: "Calibri",
                color: "323232",
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }

      if (index < resumeData.projects!.length - 1) {
        children.push(new Paragraph({ spacing: { after: 200 } }));
      }
    });

    children.push(new Paragraph({ spacing: { after: 200 } }));
  }

  // EDUCATION SECTION
  if (resumeData.education && resumeData.education.length > 0) {
    children.push(...createSectionHeader("EDUCATION"));

    resumeData.education.forEach((edu, index) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.degree,
              bold: true,
              size: 22,
              font: "Calibri",
              color: "1E1E1E",
            }),
          ],
          spacing: { after: 60 },
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.school,
              size: 20,
              font: "Calibri",
              color: "505050",
            }),
          ],
          spacing: { after: 60 },
        })
      );

      const eduDetails = [];
      if (edu.dates) eduDetails.push(edu.dates);
      if (edu.location) eduDetails.push(edu.location);

      if (eduDetails.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: eduDetails.join(' | '),
                italics: true,
                size: 18,
                font: "Calibri",
                color: "505050",
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }

      if (index < resumeData.education!.length - 1) {
        children.push(new Paragraph({ spacing: { after: 200 } }));
      }
    });

    children.push(new Paragraph({ spacing: { after: 200 } }));
  }

  // CERTIFICATIONS SECTION
  if (resumeData.certifications && resumeData.certifications.length > 0) {
    children.push(...createSectionHeader("CERTIFICATIONS"));

    resumeData.certifications.forEach((cert) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${cert}`,
              size: 18,
              font: "Calibri",
              color: "323232",
            }),
          ],
          spacing: { after: 80 },
        })
      );
    });
  }

  // Create and return the document
  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1080,   // 0.75 inch
              right: 1080, // 0.75 inch
              bottom: 1080, // 0.75 inch
              left: 1080,  // 0.75 inch
            },
          },
        },
        children: children,
      },
    ],
  });
}; 