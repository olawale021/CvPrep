import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromFile } from '../../../../lib/resume/fileParser';
import { ResumeScore, scoreResume } from '../../../../lib/resume/scoreResume';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
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
    const parseStartTime = Date.now();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimetype = file.type;
    
    let text: string;
    try {
      text = await extractTextFromFile(buffer, mimetype);
      console.log(`File parsing completed in ${Date.now() - parseStartTime}ms`);
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
    const scoreStartTime = Date.now();
    try {
      console.log(`Starting optimized resume scoring... (File size: ${file.size} bytes, Job description: ${job.length} chars)`);
      
      // Create a race condition with timeout
      const scorePromise = scoreResume(text, job);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Scoring timeout after 45 seconds')), 45000)
      );
      
      const score = await Promise.race([scorePromise, timeoutPromise]) as ResumeScore;
      const scoringTime = Date.now() - scoreStartTime;
      const totalTime = Date.now() - startTime;
      
      console.log(`✅ OPTIMIZED SCORING COMPLETED in ${scoringTime}ms (Total API time: ${totalTime}ms)`);
      console.log(`Score: ${score.match_percentage}%, Matched: ${score.matched_skills.length}, Missing: ${score.missing_skills.length}`);
      
      return NextResponse.json(score);
    } catch (scoreError) {
      const scoringTime = Date.now() - scoreStartTime;
      console.error(`❌ Resume scoring failed after ${scoringTime}ms:`, scoreError);
      
      // Check if it's a timeout error
      if (scoreError instanceof Error && scoreError.message.includes('timeout')) {
        return NextResponse.json({ 
          error: 'Scoring timeout',
          message: 'Resume scoring is taking longer than expected. Please try again with a shorter resume or job description.',
          matched_skills: [],
          missing_skills: [],
          recommendations: ['Try reducing the length of your resume or job description', 'Ensure your resume is in a standard format'],
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
    const totalTime = Date.now() - startTime;
    console.error(`SCORE API Error after ${totalTime}ms:`, error);
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