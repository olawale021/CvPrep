import { NextRequest, NextResponse } from 'next/server';
import { withFeatureLimit } from '../../../lib/auth/userRateLimit';
import { generatePersonalStatement } from '../../../lib/services/personal-statement/personalStatementService';

export async function POST(req: NextRequest) {
  return withFeatureLimit(req, 'personal_statement_create', async () => {
    try {
      const formData = await req.formData();
      const jobDescription = formData.get('jobDescription') as string;
      const wordCountStr = formData.get('wordCount') as string;
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

      // Parse and validate word count
      const wordCount = wordCountStr ? parseInt(wordCountStr, 10) : 600;
      if (isNaN(wordCount) || wordCount < 100 || wordCount > 1500) {
        return NextResponse.json(
          { error: 'Word count must be between 100 and 1500 words' },
          { status: 400 }
        );
      }

      // Generate personal statement using the service
      const result = await generatePersonalStatement(
        jobDescription.trim(),
        resumeText,
        resumeFile,
        userId,
        wordCount
      );

      return NextResponse.json(result);
    } catch (error) {
      console.error('Personal Statement API Error:', error);
      return NextResponse.json(
        {
          error: 'Personal statement generation error',
          message: error instanceof Error ? error.message : 'An error occurred during personal statement generation. Please try again.'
        },
        { status: 500 }
      );
    }
  });
} 