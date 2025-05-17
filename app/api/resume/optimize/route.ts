import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromFile } from '../../../../lib/resume/fileParser';
import { OptimizedResume, optimizeResume } from '../../../../lib/resume/optimizeResume';
import { structure_resume } from '../../../../lib/resume/resumeParser';

// Define an extended interface for the response that might have capitalized keys
interface ExtendedOptimizedResume extends OptimizedResume {
  Summary?: string;
  "Technical Skills"?: string[];
  "Work Experience"?: Array<{
    company: string;
    role: string;
    date_range: string;
    accomplishments: string[];
  }>;
  Education?: Array<{
    institution: string;
    degree: string;
    graduation_date: string;
  }>;
  Certifications?: string[];
  Projects?: string[] | Array<{
    title?: string;
    description: string;
    technologies?: string[];
  }>;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file uploaded');
    
    const job = formData.get('job') as string || '';
    if (!job) throw new Error('No job description provided');
    
    // Get this from form but don't use it
    formData.get('useOpenAI');
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimetype = file.type;
    
    // Extract text from the resume file
    const text = await extractTextFromFile(buffer, mimetype);
    console.log('Extracted text length:', text.length);
    
    // Structure the resume for better optimization
    const structuredResume = await structure_resume(text);
    console.log('Structured resume:', JSON.stringify(structuredResume, null, 2));
    
    // Optimize the resume using both text and structured data
    const optimized = await optimizeResume(text, job, structuredResume);
    
    // Log the optimized resume data for debugging
    console.log('=== OPTIMIZED RESUME DATA START ===');
    console.log('Summary:', optimized.summary ? 'Present' : 'Missing');
    console.log('Skills:', optimized.skills ? `Present (${Object.keys(optimized.skills).length} categories)` : 'Missing');
    console.log('Work Experience:', optimized.work_experience ? `Present (${optimized.work_experience.length} entries)` : 'Missing');
    console.log('Education:', optimized.education ? `Present (${optimized.education.length} entries)` : 'Missing');
    console.log('Projects:', optimized.projects ? `Present (${optimized.projects.length} entries)` : 'Missing');
    console.log('Certifications:', optimized.certifications ? `Present (${optimized.certifications.length} entries)` : 'Missing');
    
    // Typecast the optimized result to a more specific type
    const optimizedWithCapitalKeys = optimized as ExtendedOptimizedResume;
    
    // Create a properly structured response that matches frontend expectations
    const responseData = {
      ...optimized,
      // Map Technical Skills to skills if needed
      skills: optimized.skills || (optimizedWithCapitalKeys["Technical Skills"] ? {
        technical_skills: optimizedWithCapitalKeys["Technical Skills"]
      } : {}),
      // Ensure work_experience is mapped correctly
      work_experience: optimized.work_experience || optimizedWithCapitalKeys["Work Experience"] || [],
      // Map remaining fields
      summary: optimized.summary || optimizedWithCapitalKeys["Summary"] || "",
      education: optimized.education || optimizedWithCapitalKeys["Education"] || [],
      certifications: optimized.certifications || optimizedWithCapitalKeys["Certifications"] || [],
      projects: optimized.projects || optimizedWithCapitalKeys["Projects"] || []
    };
    
    // Sample of data returned from each section
    if (responseData.skills) {
      console.log('Skills Sample:', Object.keys(responseData.skills));
    }
    
    if (responseData.work_experience && responseData.work_experience.length > 0) {
      console.log('Work Experience Sample:', responseData.work_experience[0]);
    }
    
    // Log full data structure for debugging
    console.log('Full response data:', JSON.stringify(responseData, null, 2));
    console.log('=== OPTIMIZED RESUME DATA END ===');
    
    return NextResponse.json(responseData);
  } catch (error: unknown) {
    console.error('Optimize API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
} 