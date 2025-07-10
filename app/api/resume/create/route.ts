import { NextRequest, NextResponse } from 'next/server';
import { withFeatureLimit } from '../../../../lib/auth/userRateLimit';
import { createResumeFromScratch, CreateResumeRequest } from '../../../../lib/services/resume/resumeUtils/createResume';

export async function POST(req: NextRequest) {
  return withFeatureLimit(req, 'resume_create', async () => {
    try {
      const requestData: CreateResumeRequest = await req.json();

      const result = await createResumeFromScratch(requestData);

      if (!result.success) {
        return NextResponse.json({ 
          error: result.error
        }, { status: 400 });
      }

      return NextResponse.json(result);

    } catch (error) {
      console.error('Resume creation route error:', error);
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred during resume generation',
        success: false
      }, { status: 500 });
    }
  });
} 