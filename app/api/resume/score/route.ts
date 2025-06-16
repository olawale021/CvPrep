import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromFile } from '../../../../lib/services/resume/fileParser';
import { scoreResume } from '../../../../lib/services/resume/scoreResume';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ 
        error: 'No file uploaded',
        message: 'Please upload a resume file to score.'
      }, { status: 400 });
    }

    const job = formData.get('job') as string || '';
    if (!job) {
      return NextResponse.json({ 
        error: 'No job description provided',
        message: 'Please provide a job description to score the resume against.'
      }, { status: 400 });
    }

    // Extract text from file with timeout protection
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimetype = file.type;
    
    let text: string;
    try {
      text = await extractTextFromFile(buffer, mimetype);
    } catch (fileError) {
      console.error('File parsing error:', fileError);
      return NextResponse.json({ 
        error: 'File parsing failed',
        message: 'Unable to extract text from the uploaded file. Please try a different format.',
        matched_skills: [],
        missing_skills: [],
        recommendations: ['Please upload a different file format (PDF, DOC, DOCX, or TXT)'],
        match_percentage: 0,
        match_score: 0
      }, { status: 422 });
    }

    // Score resume with timeout protection
    try {
      const score = await scoreResume(text, job);
      return NextResponse.json(score);
    } catch (scoreError) {
      console.error('Resume scoring error:', scoreError);
      
      // Check if it's a timeout error
      if (scoreError instanceof Error && scoreError.message.includes('timeout')) {
        return NextResponse.json({ 
          error: 'Scoring timeout',
          message: 'Resume scoring is taking longer than expected. Please try again.',
          matched_skills: [],
          missing_skills: [],
          recommendations: ['The resume is quite complex. Try simplifying it or check back in a moment.'],
          match_percentage: 0,
          match_score: 0
        }, { status: 408 }); // Request Timeout
      }
      
      // Return a properly formatted error response that matches ResumeScore interface
      return NextResponse.json({ 
        error: 'Scoring failed',
        message: 'An error occurred while scoring the resume. Please try again.',
        matched_skills: [],
        missing_skills: [],
        recommendations: ['Please try again. If the problem persists, contact support.'],
        match_percentage: 0,
        match_score: 0
      }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error('SCORE API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Always return proper JSON structure to prevent frontend parsing errors
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again.',
      details: errorMessage,
      matched_skills: [],
      missing_skills: [],
      recommendations: ['Please try uploading your resume again.'],
      match_percentage: 0,
      match_score: 0
    }, { status: 500 });
  }
} 