import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { extractTextFromFile } from '../../../../lib/resume/fileParser';
import { structure_resume } from '../../../../lib/resume/resumeParser';

const openaiApiKey = process.env.OPENAI_API_KEY;
let openai: OpenAI | null = null;
if (openaiApiKey) {
  openai = new OpenAI({ apiKey: openaiApiKey });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

interface WorkExperienceItem {
  company: string;
  role?: string;
  title?: string;
  date_range?: string;
  dates?: string;
  accomplishments?: string[];
  bullets?: string[];
  location?: string;
}

async function generateAchievements(jobTitle: string, company: string): Promise<string[]> {
  if (!openai) {
    // Fallback achievements if OpenAI is not available
    return [
      `Contributed to key projects and initiatives at ${company}`,
      `Collaborated effectively with team members to achieve departmental goals`,
      `Maintained high standards of work quality and professionalism`
    ];
  }

  try {
    const prompt = `Generate 5 professional achievement bullet points for a ${jobTitle} position at ${company}. 
    
    Requirements:
    - Use action verbs and quantifiable results where possible
    - Make them realistic and industry-appropriate
    - Focus on common responsibilities and achievements for this role
    - Keep each bullet point concise (1-2 lines)
    - Use professional resume language
    
    Format as a JSON array of strings.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional resume writer. Generate realistic, professional achievement bullet points for work experience. Return only a JSON array of strings.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '';
    const result = JSON.parse(content);
    
    // Extract achievements from various possible response formats
    if (Array.isArray(result)) {
      return result;
    } else if (result.achievements && Array.isArray(result.achievements)) {
      return result.achievements;
    } else if (result.bullets && Array.isArray(result.bullets)) {
      return result.bullets;
    } else {
      // Fallback if parsing fails
      return [
        `Contributed to key projects and initiatives at ${company}`,
        `Collaborated effectively with team members to achieve departmental goals`,
        `Maintained high standards of work quality and professionalism`
      ];
    }
  } catch (error) {
    console.error('Error generating achievements:', error);
    // Fallback achievements
    return [
      `Contributed to key projects and initiatives at ${company}`,
      `Collaborated effectively with team members to achieve departmental goals`,
      `Maintained high standards of work quality and professionalism`
    ];
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) throw new Error('No resume file uploaded');

    const jobTitle = formData.get('jobTitle') as string;
    const company = formData.get('company') as string;
    const achievements = formData.get('achievements') as string;

    if (!jobTitle || !company) {
      throw new Error('Job title and company are required');
    }

    // Extract text from the resume file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimetype = file.type;
    const resumeText = await extractTextFromFile(buffer, mimetype);

    // Structure the existing resume
    const structuredResume = await structure_resume(resumeText);

    // Generate achievements if not provided
    let finalAchievements: string[];
    if (achievements && achievements.trim()) {
      // Use provided achievements, split by newlines or bullet points
      finalAchievements = achievements
        .split(/\n|•|-/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
    } else {
      // Generate achievements using OpenAI
      finalAchievements = await generateAchievements(jobTitle, company);
    }

    // Create new work experience entry
    const newWorkExperience = {
      company: company,
      role: jobTitle,
      title: jobTitle,
      date_range: "Present", // Default to present, user can edit later
      dates: "Present",
      accomplishments: finalAchievements,
      bullets: finalAchievements,
      location: "" // Can be added later if needed
    };

    // Add the new work experience to the existing resume
    const updatedWorkExperience = [
      newWorkExperience,
      ...structuredResume["Work Experience"].map((exp: WorkExperienceItem) => ({
        ...exp,
        title: exp.title || exp.role || "",
        dates: exp.dates || exp.date_range || "",
        bullets: exp.bullets || exp.accomplishments || [],
        location: exp.location || ""
      }))
    ];

    // Create updated resume structure
    const updatedResume = {
      ...structuredResume,
      "Work Experience": updatedWorkExperience,
      work_experience: updatedWorkExperience.map((exp: WorkExperienceItem) => ({
        company: exp.company,
        title: exp.title || exp.role || "",
        role: exp.role || exp.title || "",
        dates: exp.dates || exp.date_range || "",
        date_range: exp.date_range || exp.dates || "",
        bullets: exp.bullets || exp.accomplishments || [],
        accomplishments: exp.accomplishments || exp.bullets || [],
        location: exp.location || ""
      }))
    };

    // Return the updated resume data
    const responseData = {
      success: true,
      message: 'Work experience added successfully',
      updatedResume: updatedResume,
      addedExperience: newWorkExperience,
      // Format for frontend compatibility
      summary: structuredResume.Summary || "",
      skills: structuredResume["Technical Skills"] ? {
        technical_skills: structuredResume["Technical Skills"]
      } : {},
      work_experience: updatedResume.work_experience,
      education: structuredResume.Education || [],
      certifications: structuredResume.Certifications || [],
      projects: structuredResume.Projects || [],
      contact_details: {
        name: "",
        email: "",
        phone_number: "",
        location: ""
      }
    };

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    console.error('Add experience API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 400 });
  }
} 