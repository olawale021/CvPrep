import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { extractTextFromFile } from '../../../lib/resume/fileParser';
import { extract_job_requirements } from '../../../lib/resume/jobParser';
import { structure_resume } from '../../../lib/resume/resumeParser';

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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const jobDescription = formData.get('jobDescription') as string;
    const resumeText = formData.get('resumeText') as string | null;
    const resumeFile = formData.get('resumeFile') as File | null;
    const userId = formData.get('userId') as string | null;

    if (!jobDescription) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      );
    }

    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API not configured' },
        { status: 500 }
      );
    }

    // Get resume text either from provided text or by parsing file
    let resumeData: string;
    if (resumeText) {
      resumeData = resumeText;
    } else if (resumeFile) {
      const fileBuffer = Buffer.from(await resumeFile.arrayBuffer());
      resumeData = await extractTextFromFile(fileBuffer, resumeFile.type);
    } else {
      return NextResponse.json(
        { error: 'No resume data provided' },
        { status: 400 }
      );
    }

    // Extract job requirements for better tailoring
    const jobRequirements = await extract_job_requirements(jobDescription);
    
    // Structure the resume data
    const structuredResume = await structure_resume(resumeData);

    const prompt = `
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

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert cover letter writer who creates personalized, compelling cover letters
          that highlight a candidate's relevant skills and experiences for specific job positions.
          Your cover letters are concise, professional, and tailored to both the candidate and the position.`
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.4
    });

    // Extract the cover letter text
    const coverLetterText = response.choices[0].message.content?.trim() || '';

    // Create a structured response
    const coverLetterResponse: CoverLetterResponse = {
      cover_letter: coverLetterText,
      created_at: new Date().toISOString(),
      word_count: coverLetterText.split(/\s+/).length,
      is_tailored: true,
      user_id: userId || undefined
    };

    return NextResponse.json(coverLetterResponse);
  } catch (error) {
    console.error('Cover Letter Generation Error:', error);
    return NextResponse.json(
      {
        error: 'Cover letter generation error',
        message: 'An error occurred during cover letter generation. Please try again.'
      },
      { status: 500 }
    );
  }
}
