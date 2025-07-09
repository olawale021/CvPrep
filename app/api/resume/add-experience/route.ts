import { NextRequest, NextResponse } from 'next/server';
import { withFeatureLimit } from '../../../../lib/auth/userRateLimit';
import { addWorkExperience } from '../../../../lib/services/resume/resumeUtils/addExperienceService';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  return withFeatureLimit(req, 'resume_optimize', async () => {
    try {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const jobTitle = formData.get('jobTitle') as string;
      const company = formData.get('company') as string;
      const achievements = formData.get('achievements') as string;

      // Validate required fields
      if (!file) {
        return NextResponse.json({ 
          success: false, 
          error: 'No resume file uploaded' 
        }, { status: 400 });
      }

      if (!jobTitle || !company) {
        return NextResponse.json({ 
          success: false, 
          error: 'Job title and company are required' 
        }, { status: 400 });
      }

      // Add work experience using the service
      const result = await addWorkExperience(
        file,
        jobTitle.trim(),
        company.trim(),
        achievements?.trim()
      );

      // Return appropriate status based on success
      if (result.success) {
        return NextResponse.json(result);
      } else {
        return NextResponse.json(result, { status: 400 });
      }
    } catch (error: unknown) {
      console.error('Add experience API error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return NextResponse.json({ 
        success: false, 
        error: errorMessage 
      }, { status: 500 });
    }
  });
} 