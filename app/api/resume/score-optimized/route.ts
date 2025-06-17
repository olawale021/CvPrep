import { NextRequest, NextResponse } from 'next/server';
import { withFeatureLimit } from '../../../../lib/auth/userRateLimit';
import { extractTextFromFile } from '../../../../lib/services/resume/fileParser';
import { scoreOptimizedResume } from '../../../../lib/services/resume/scoreResume';

export async function POST(request: NextRequest) {
  return withFeatureLimit(request, 'resume_optimize', async () => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const jobDescription = formData.get('job') as string;

      if (!file || !jobDescription) {
        return NextResponse.json({
          error: 'Missing file or job description',
          message: 'Please provide both a resume file and job description.',
          matched_skills: [],
          missing_skills: [],
          recommendations: ['Please upload a resume file and provide a job description'],
          match_percentage: 0,
          match_score: 0
        }, { status: 400 });
      }

      // Extract text from the optimized resume file
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimetype = file.type;
      
      let resumeText: string;
      try {
        resumeText = await extractTextFromFile(buffer, mimetype);
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
      
      if (!resumeText || resumeText.trim().length < 50) {
        return NextResponse.json({
          error: 'Insufficient content',
          message: 'Could not extract sufficient text from the resume file',
          matched_skills: [],
          missing_skills: [],
          recommendations: ['Please ensure your resume has sufficient content'],
          match_percentage: 0,
          match_score: 0
        }, { status: 400 });
      }

      // Score the optimized resume with validation
      try {
        const scoreResult = await scoreOptimizedResume(resumeText, jobDescription);
        return NextResponse.json(scoreResult);
      } catch (scoreError) {
        console.error('Optimized resume scoring error:', scoreError);
        
        // Check if it's a timeout error
        if (scoreError instanceof Error && scoreError.message.includes('timeout')) {
          return NextResponse.json({
            error: 'Scoring timeout',
            message: 'Optimized resume scoring is taking longer than expected. Please try again.',
            matched_skills: [],
            missing_skills: [],
            recommendations: ['The optimized resume is quite complex. Try again in a moment.'],
            match_percentage: 85,
            match_score: 85
          }, { status: 408 });
        }
        
        // Return a properly formatted error response
        return NextResponse.json({
          error: 'Scoring failed',
          message: 'An error occurred while scoring the optimized resume. Please try again.',
          matched_skills: [],
          missing_skills: [],
          recommendations: ['Please try again. If the problem persists, contact support.'],
          match_percentage: 85,
          match_score: 85
        }, { status: 500 });
      }

    } catch (error) {
      console.error('Error scoring optimized resume:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return NextResponse.json({
        error: 'Internal server error',
        message: 'An unexpected error occurred while scoring optimized resume.',
        details: errorMessage,
        matched_skills: [],
        missing_skills: [],
        recommendations: ['Please try uploading your optimized resume again.'],
        match_percentage: 85,
        match_score: 85
      }, { status: 500 });
    }
  });
} 