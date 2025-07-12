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

export interface PersonalStatementResponse {
  personal_statement: string;
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

function createPersonalStatementPrompt(
  structuredResume: StructuredResume,
  jobDescription: string,
  jobRequirements: JobRequirements,
  targetWordCount: number = 600
): string {
  return `
Create a comprehensive personal statement/supporting information section based on the candidate's resume and the job description.

This is a FULL personal statement suitable for:
- Public sector roles (NHS, government jobs)
- Academic posts
- Applications requiring "supporting information" or "personal statement" sections
- Formal application forms

TARGET WORD COUNT: ${targetWordCount} words (±50 words acceptable)

STRUCTURE (Follow this flow without explicit headings):

1. INTRODUCTION 
   - Who you are professionally
   - Why you're applying for this specific role
   - Brief overview of your relevant background

2. EVIDENCE OF SKILLS AND EXPERIENCE 
   - Address each key requirement from the job description
   - Use the STAR method seamlessly within flowing paragraphs:
     * Weave situation, task, action, and result into natural narrative sentences
     * Don't label each part - make it flow as storytelling
   - PROVE skills with specific examples, don't just claim them
   - Focus on achievements most relevant to the role
   - Each paragraph should demonstrate one key competency/requirement

3. FIT AND MOTIVATION 
   - Why you want THIS specific job at THIS organization
   - How your values align with their mission/values
   - Your understanding of the role and organization
   - Future goals and career aspirations aligned with the position

4. CLOSING 
   - Positive reinforcement of your enthusiasm
   - Confidence in your ability to contribute
   - Professional closing statement

FORMATTING REQUIREMENTS:
- NO bold headings or section titles
- NO bullet points or numbered lists
- Write as flowing, connected paragraphs
- Use transitions between paragraphs
- STAR method should be invisible - woven into natural storytelling
- Target length: ${targetWordCount} words (adjust content depth to meet this target)
- Written in first person
- Use evidence, not just claims
- Each skill/competency should be backed by a specific example
- Focus on outcomes and measurable results
- Professional yet personal tone
- Avoid generic statements and clichés
- Tailor specifically to the job requirements and organization

Resume Data:
${JSON.stringify(structuredResume, null, 2)}

Job Description:
${jobDescription}

Job Requirements:
${JSON.stringify(jobRequirements, null, 2)}

Remember: This is NOT a CV summary - it's a comprehensive supporting statement that demonstrates how you meet the essential and desirable criteria through concrete examples. Write it as natural, flowing prose without explicit structure labels. IMPORTANT: Aim for exactly ${targetWordCount} words.
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

export async function generatePersonalStatement(
  jobDescription: string,
  resumeText?: string | null,
  resumeFile?: File | null,
  userId?: string | null,
  targetWordCount: number = 600
): Promise<PersonalStatementResponse> {
  try {
    // Validate inputs
    if (!jobDescription || jobDescription.trim().length === 0) {
      throw new Error('Job description is required');
    }

    if (targetWordCount < 100 || targetWordCount > 1500) {
      throw new Error('Target word count must be between 100 and 1500 words');
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

    // Create the prompt with target word count
    const prompt = createPersonalStatementPrompt(structuredResume, jobDescription, jobRequirements, targetWordCount);

    // Generate personal statement using OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are an expert career counselor specializing in personal statements for public sector, academic, and formal application processes.

Write comprehensive personal statements that are:
- Evidence-based with specific examples using the STAR method seamlessly woven into narrative flow
- Written as natural, flowing prose without explicit headings or section labels
- Professional yet personal in tone with smooth transitions between paragraphs
- Results-oriented with quantifiable achievements naturally integrated into storytelling
- Tailored to the specific role and organization
- Appropriate for formal application processes
- Free from generic statements and clichés
- EXACTLY meeting the specified target word count (±50 words acceptable)

CRITICAL FORMATTING REQUIREMENTS:
- NO bold headings, section titles, or structural labels
- NO bullet points or numbered lists
- Write as connected, flowing paragraphs
- STAR method should be invisible - woven into natural narrative sentences
- Use smooth transitions between different topics/competencies
- Each paragraph should demonstrate one key requirement in the job description through storytelling
- Adjust content depth and detail to meet the exact target word count

Focus on:
- Proving competencies through concrete examples told as natural stories
- Demonstrating understanding of the role and organization
- Showing career progression and relevant experience
- Quantifiable results and specific outcomes integrated naturally
- Values alignment with the organization
- Future aspirations aligned with the role

Avoid:
- Any structural labels or headings
- Bullet points or explicit STAR breakdowns
- Generic claims without evidence
- Repetition of CV information without adding insight
- Vague statements that could apply to anyone
- Overly casual language inappropriate for formal applications
- Clichés without substantial backing
- Failing to address specific job requirements
- Going significantly over or under the target word count
      `.trim()
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.6,
      max_tokens: Math.min(2000, Math.ceil(targetWordCount * 1.5)) // Adjust max tokens based on target word count
    });

    // Extract the personal statement text
    const personalStatementText = response.choices[0].message.content?.trim() || '';

    if (!personalStatementText) {
      throw new Error('Failed to generate personal statement content');
    }

    // Create a structured response
    const personalStatementResponse: PersonalStatementResponse = {
      personal_statement: personalStatementText,
      created_at: new Date().toISOString(),
      word_count: personalStatementText.split(/\s+/).length,
      is_tailored: true,
      user_id: userId || undefined
    };

    return personalStatementResponse;
  } catch (error) {
    console.error('Personal Statement Generation Error:', error);
    throw error; // Let the error propagate instead of returning a default
  }
} 