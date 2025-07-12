import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { generateWordDocument } from "../../app/resume/optimize/templates";
import { ResumeData, ResumeResponse } from "../../app/resume/optimize/types";

export type WordTemplate = "classic" | "modern" | "professional";

export function useWordxDownload() {
  /**
   * Download resume as Word document using the specified template
   */
  const downloadResumeAsWord = async (
    resumeData: ResumeData,
    resumeResponse: ResumeResponse | null,
    template: WordTemplate = "classic",
    filename?: string
  ) => {
    try {
      // Generate the Word document using the centralized template system
      const doc = generateWordDocument(resumeData, resumeResponse, template);
      
      if (!doc) {
        console.error("Failed to generate Word document");
        return;
      }
      
      // Generate filename
      const contactDetails = resumeData.contact_details || resumeResponse?.contact_details || {};
      const name = contactDetails.name || "Resume";
      const defaultFilename = `${name.replace(/\s+/g, "_")}_${template}.docx`;
      
      // Convert to blob and download
      const blob = await Packer.toBlob(doc);
      saveAs(blob, filename || defaultFilename);
      
    } catch (error) {
      console.error("Error generating Word document:", error);
      throw error;
    }
  };

  /**
   * Generic download function for any content (for interview prep, etc.)
   */
  const downloadWordx = async (title: string, sections: { heading: string, content: string | string[] }[]) => {
    try {
      const children: Paragraph[] = [];

      // Add title
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: title,
              bold: true,
              size: 32,
              font: "Calibri",
            }),
          ],
          spacing: { after: 400 },
        })
      );

      // Add sections
      sections.forEach((section, index) => {
        // Section heading
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: section.heading,
                bold: true,
                size: 24,
                font: "Calibri",
              }),
            ],
            spacing: { after: 200 },
          })
        );

        // Section content
        if (Array.isArray(section.content)) {
          section.content.forEach((line) => {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                    size: 20,
                    font: "Calibri",
                  }),
                ],
                spacing: { after: 100 },
              })
            );
          });
        } else {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: section.content,
                  size: 20,
                  font: "Calibri",
                }),
              ],
              spacing: { after: 100 },
            })
          );
        }

        // Add spacing between sections
        if (index < sections.length - 1) {
          children.push(new Paragraph({ spacing: { after: 300 } }));
        }
      });

      const doc = new Document({
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

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${title.replace(/\s+/g, "_")}.docx`);
    } catch (error) {
      console.error("Error generating Word document:", error);
      throw error;
    }
  };

  return { downloadResumeAsWord, downloadWordx };
} 