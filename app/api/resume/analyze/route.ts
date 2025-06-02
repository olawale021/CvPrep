import { NextRequest, NextResponse } from 'next/server';
import { extractContactDetails } from '../../../../lib/resume/extractContactDetails';
import { extractTextFromFile } from '../../../../lib/resume/fileParser';
import { structure_resume } from '../../../../lib/resume/resumeParser';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const jobDescription = formData.get('job') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!jobDescription) {
      return NextResponse.json({ error: 'No job description provided' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Extract text from the file
    const resumeText = await extractTextFromFile(buffer, file.type);
    
    // Structure the resume (analyze without optimization)
    const structuredResume = await structure_resume(resumeText);
    
    // Extract contact details
    const contactDetails = await extractContactDetails(resumeText);
    
    // Use only the skills that were actually found in the resume (no generation during analysis)
    const technicalSkills = structuredResume["Technical Skills"] || [];
    
    // Convert to the format expected by the frontend
    const analyzedResume = {
      summary: structuredResume.Summary || "",
      contact_details: contactDetails,
      work_experience: structuredResume["Work Experience"]?.map(exp => ({
        company: exp.company,
        title: exp.role,
        dates: exp.date_range,
        accomplishments: exp.accomplishments
      })) || [],
      skills: {
        technical_skills: technicalSkills
      },
      education: structuredResume.Education?.map(edu => ({
        degree: edu.degree,
        school: edu.institution,
        dates: edu.graduation_date
      })) || [],
      certifications: structuredResume.Certifications || [],
      projects: structuredResume.Projects?.map(project => ({
        name: project,
        description: project
      })) || []
    };
    
    return NextResponse.json(analyzedResume);
    
  } catch (error) {
    console.error('ANALYZE API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze resume' },
      { status: 500 }
    );
  }
} 