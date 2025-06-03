import { NextRequest, NextResponse } from 'next/server';
import { generateCoverLetter } from '../../../lib/resume/coverLetterService';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const jobDescription = formData.get('jobDescription') as string;
    const resumeText = formData.get('resumeText') as string | null;
    const resumeFile = formData.get('resumeFile') as File | null;
    const userId = formData.get('userId') as string | null;

    // Validate required fields
    if (!jobDescription || jobDescription.trim().length === 0) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      );
    }

    if (!resumeText && !resumeFile) {
      return NextResponse.json(
        { error: 'Resume data is required (either text or file)' },
        { status: 400 }
      );
    }

    // Generate cover letter using the service
    const result = await generateCoverLetter(
      jobDescription.trim(),
      resumeText,
      resumeFile,
      userId
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Cover Letter API Error:', error);
    return NextResponse.json(
      {
        error: 'Cover letter generation error',
        message: error instanceof Error ? error.message : 'An error occurred during cover letter generation. Please try again.'
      },
      { status: 500 }
    );
  }
}
