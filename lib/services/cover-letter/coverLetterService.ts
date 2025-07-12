import OpenAI from 'openai';
import { extractTextFromFile } from '../resume/resumeUtils/fileParser';
import { extract_job_requirements } from '../resume/resumeUtils/jobParser';
import { structure_resume, StructuredResume } from '../resume/resumeUtils/resumeParser';

// Initialize OpenAI client (consistent with other services)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface CoverLetterResponse {
  cover_letter: string;
  created_at: string;
  word_count: number;
  is_tailored: boolean;
  user_id?: string;
}

export interface JobRequirements {
  required_skills: string[];
  preferred_skills: string[];
  experience_level: string;
  education_requirements: string[];
  job_responsibilities: string[];
}

function createCoverLetterPrompt(
  structuredResume: StructuredResume,
  jobDescription: string,
  jobRequirements: JobRequirements
): string {
  return `
Create a professional cover letter based on the candidate's resume and the job description.

IMPORTANT FORMATTING INSTRUCTIONS:
- DO NOT include any header information (name, address, phone, email, date)
- DO NOT include placeholder brackets like [Your Name], [Your Address], [Date], etc.
- Start directly with the greeting (e.g., "Dear Hiring Manager," or "Dear [Company] Team,")
- End with a professional closing (e.g., "Sincerely," or "Best regards,") followed by a line break

The cover letter should:
1. Start with a proper greeting and introduction that mentions the specific position
2. Include 2-3 paragraphs highlighting relevant skills and experiences from the resume
3. Explain why the candidate is a good fit for this specific role and company
4. Include a strong closing paragraph with a call to action
5. End with a professional sign-off (without placeholder names)

Make the letter:
- Personalized to both the candidate's background and the job requirements
- Concise (285-320 words)
- Professional in tone
- Highlight the candidate's most relevant achievements
- Address specific requirements from the job description
- Ready to use without any placeholder text that needs to be filled in

Resume Data:
${JSON.stringify(structuredResume, null, 2)}

Job Description:
${jobDescription}

Job Requirements:
${JSON.stringify(jobRequirements, null, 2)}
`;
}

async function processResumeData(
  resumeText?: string | null,
  resumeFile?: File | null
): Promise<string> {
  try {
    if (resumeText && resumeText.trim().length > 0) {
  
      return resumeText.trim();
    } else if (resumeFile) {
      
      
      // Validate file size (10MB limit)
      if (resumeFile.size > 10 * 1024 * 1024) {
        throw new Error('Resume file is too large. Please use a file smaller than 10MB.');
      }
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(resumeFile.type)) {
        throw new Error('Unsupported file type. Please use PDF, TXT, DOC, or DOCX files.');
      }
      
      const fileBuffer = Buffer.from(await resumeFile.arrayBuffer());
      const extractedText = await extractTextFromFile(fileBuffer, resumeFile.type);
      
      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error('Could not extract meaningful text from the resume file. Please check the file is not corrupted or empty.');
      }
      
  
      return extractedText.trim();
    } else {
      throw new Error('No resume data provided. Please provide either resume text or upload a resume file.');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error processing resume data';
    console.error('Resume data processing error:', {
      error: errorMessage,
      hasResumeText: !!resumeText,
      hasResumeFile: !!resumeFile,
      fileName: resumeFile?.name || 'none',
      fileSize: resumeFile?.size || 0
    });
    throw new Error(`Resume processing failed: ${errorMessage}`);
  }
}

export async function generateCoverLetter(
  jobDescription: string,
  resumeText?: string | null,
  resumeFile?: File | null,
  userId?: string | null
): Promise<CoverLetterResponse> {
  try {
    // Validate inputs
    if (!jobDescription || jobDescription.trim().length === 0) {
      throw new Error('Job description is required');
    }

    // Log request details for debugging


    // Get resume text
    const resumeData = await processResumeData(resumeText, resumeFile);

    // Extract job requirements for better tailoring
    const jobRequirements = await extract_job_requirements(jobDescription);
    
    // Structure the resume data
    const structuredResume = await structure_resume(resumeData);

    // Create the prompt
    const prompt = createCoverLetterPrompt(structuredResume, jobDescription, jobRequirements);

    // Generate cover letter using OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Updated to match other services
      messages: [
        {
          role: "system",
          content: `
You are an expert cover letter writer. 
Write cover letters that are:
- Clear and easy to understand. Use short sentences and simple words.
- Direct and concise. Get to the point and remove unnecessary words.
- Honest and real. Don't force friendliness or use hype.
- Conversational and natural. It's okay to start sentences with "and" or "but."
- Avoid marketing language, clichés, and AI-giveaway phrases.
- Use active voice and address the reader directly with "you" and "your."
- Vary sentence length for rhythm.
- Don't stress about perfect grammar; lowercase "i" is fine if it fits the style.
- Focus on what matters for the job and the candidate.

Example:
Instead of: "This revolutionary product will transform your life."
Use: "This product can help you."

Instead of: "Let's dive into this game-changing solution."
Use: "Here's how it works."

IMPORTANT: Always provide complete, full-length cover letters. Ensure the response is not truncated.
      `.trim()
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 2000 // Added to prevent truncation
    });

    // Log response details for debugging


    // Check if response was truncated
    if (response.choices[0].finish_reason === 'length') {
      console.warn("OpenAI response was truncated due to length limit");
    }

    // Extract the cover letter text
    const coverLetterText = response.choices[0].message.content?.trim() || '';

    if (!coverLetterText) {
      throw new Error('Failed to generate cover letter content - empty response from OpenAI');
    }

    // Validate cover letter length (should be substantial)
    if (coverLetterText.length < 200) {
      console.warn("Cover letter seems too short:", { length: coverLetterText.length });
    }

    // Create a structured response
    const coverLetterResponse: CoverLetterResponse = {
      cover_letter: coverLetterText,
      created_at: new Date().toISOString(),
      word_count: coverLetterText.split(/\s+/).length,
      is_tailored: true,
      user_id: userId || undefined
    };



    return coverLetterResponse;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Cover Letter Generation Error:', {
      error: errorMessage,
      jobDescriptionLength: jobDescription?.length || 0,
      hasResumeText: !!resumeText,
      hasResumeFile: !!resumeFile
    });
    
    // Throw the error instead of returning fallback content
    throw new Error(`Cover letter generation failed: ${errorMessage}`);
  }
} 