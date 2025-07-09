import OpenAI from 'openai';
import { extractTextFromFile } from '../resume/resumeUtils/fileParser';
import { extract_job_requirements } from '../resume/resumeUtils/jobParser';
import { structure_resume, StructuredResume } from '../resume/resumeUtils/resumeParser';

// Initialize OpenAI client
const openaiApiKey = process.env.OPENAI_API_KEY;
let openai: OpenAI | null = null;
if (openaiApiKey) {
  openai = new OpenAI({ apiKey: openaiApiKey });
}

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

The cover letter should:
1. Start with a proper greeting and introduction that mentions the specific position
2. Include 2-3 paragraphs highlighting relevant skills and experiences from the resume
3. Explain why the candidate is a good fit for this specific role and company
4. Include a strong closing paragraph with a call to action
5. End with a professional sign-off

Make the letter:
- Personalized to both the candidate's background and the job requirements
- Concise (285-320 words)
- Professional in tone
- Highlight the candidate's most relevant achievements
- Address specific requirements from the job description

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
  if (resumeText) {
    return resumeText;
  } else if (resumeFile) {
    const fileBuffer = Buffer.from(await resumeFile.arrayBuffer());
    return await extractTextFromFile(fileBuffer, resumeFile.type);
  } else {
    throw new Error('No resume data provided');
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

    if (!openai) {
      throw new Error('OpenAI API not configured');
    }

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
      model: "gpt-4",
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
      `.trim()
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.4
    });

    // Extract the cover letter text
    const coverLetterText = response.choices[0].message.content?.trim() || '';

    if (!coverLetterText) {
      throw new Error('Failed to generate cover letter content');
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
    console.error('Cover Letter Generation Error:', error);
    
    // Return a basic cover letter if generation fails
    return {
      cover_letter: "Dear Hiring Manager,\n\nI am writing to express my interest in the position described in your job posting. Based on my background and experience, I believe I would be a strong candidate for this role.\n\nI look forward to the opportunity to discuss how my skills and experience can contribute to your team.\n\nSincerely,\n[Your Name]",
      created_at: new Date().toISOString(),
      word_count: 45,
      is_tailored: false,
      user_id: userId || undefined
    };
  }
} 