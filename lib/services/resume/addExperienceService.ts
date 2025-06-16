import OpenAI from 'openai';
import { extractTextFromFile } from './fileParser';
import { structure_resume, StructuredResume } from './resumeParser';

const openaiApiKey = process.env.OPENAI_API_KEY;
let openai: OpenAI | null = null;
if (openaiApiKey) {
  openai = new OpenAI({ apiKey: openaiApiKey });
}

export interface WorkExperienceItem {
  company: string;
  role: string;
  title?: string;
  date_range: string;
  dates?: string;
  accomplishments: string[];
  bullets?: string[];
  location?: string;
}

export interface AddExperienceResponse {
  success: boolean;
  message: string;
  updatedResume: StructuredResume | null;
  addedExperience: WorkExperienceItem;
  summary: string;
  skills: {
    technical_skills?: string[];
  };
  work_experience: WorkExperienceItem[];
  education: string[];
  certifications: string[];
  projects: string[];
  contact_details: {
    name: string;
    email: string;
    phone_number: string;
    location: string;
  };
}

function createAchievementsPrompt(jobTitle: string, company: string): string {
  return `Generate 5 professional achievement bullet points for a ${jobTitle} position at ${company}. 

Requirements:
- Use action verbs and quantifiable results where possible
- Make them realistic and industry-appropriate
- Focus on common responsibilities and achievements for this role
- Keep each bullet point concise (1-2 lines)
- Use professional resume language

Format as a JSON array of strings.`;
}

function parseAchievementsResponse(content: string): string[] {
  try {
    // Clean the content before parsing
    let cleanContent = content.trim();
    
    // Remove any potential markdown formatting
    cleanContent = cleanContent.replace(/```json\n?|```\n?/g, '');
    
    // Try to fix common JSON issues
    cleanContent = cleanContent.replace(/\n/g, '\\n');
    cleanContent = cleanContent.replace(/\r/g, '\\r');
    cleanContent = cleanContent.replace(/\t/g, '\\t');
    
    // Parse the JSON
    const result = JSON.parse(cleanContent);
    
    // Extract achievements from various possible response formats
    if (Array.isArray(result)) {
      return result;
    } else if (result.achievements && Array.isArray(result.achievements)) {
      return result.achievements;
    } else if (result.bullets && Array.isArray(result.bullets)) {
      return result.bullets;
    } else {
      // Fallback if unexpected format
      return [
        "Contributed to key projects and initiatives",
        "Collaborated effectively with team members to achieve departmental goals",
        "Maintained high standards of work quality and professionalism"
      ];
    }
  } catch (parseError) {
    console.error("Failed to parse achievements JSON:", {
      error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
      content: content.substring(0, 500) + '...'
    });
    
    // Return default achievements if parsing fails
    return [
      "Contributed to key projects and initiatives",
      "Collaborated effectively with team members to achieve departmental goals",
      "Maintained high standards of work quality and professionalism"
    ];
  }
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
    const prompt = createAchievementsPrompt(jobTitle, company);

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
    return parseAchievementsResponse(content);
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

export async function addWorkExperience(
  file: File,
  jobTitle: string,
  company: string,
  achievements?: string
): Promise<AddExperienceResponse> {
  try {
    // Validate inputs
    if (!file) {
      throw new Error('No resume file uploaded');
    }

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

    // Create new work experience entry - ensure all required fields are present
    const newWorkExperience: WorkExperienceItem = {
      company: company,
      role: jobTitle,
      title: jobTitle,
      date_range: "Present", // Default to present, user can edit later
      dates: "Present",
      accomplishments: finalAchievements,
      bullets: finalAchievements,
      location: "" // Can be added later if needed
    };

    // Convert existing work experience to match StructuredResume format
    const existingWorkExperience = structuredResume["Work Experience"].map(exp => ({
      company: exp.company,
      role: exp.role,
      date_range: exp.date_range,
      accomplishments: exp.accomplishments
    }));

    // Add the new work experience to the existing resume (StructuredResume format)
    const updatedWorkExperience = [
      {
        company: newWorkExperience.company,
        role: newWorkExperience.role,
        date_range: newWorkExperience.date_range,
        accomplishments: newWorkExperience.accomplishments
      },
      ...existingWorkExperience
    ];

    // Create updated resume structure that matches StructuredResume interface
    const updatedResume: StructuredResume = {
      Summary: structuredResume.Summary || "",
      "Work Experience": updatedWorkExperience,
      "Technical Skills": structuredResume["Technical Skills"] || [],
      Education: structuredResume.Education || [],
      Certifications: structuredResume.Certifications || [],
      Projects: structuredResume.Projects || []
    };

    // Return the updated resume data
    return {
      success: true,
      message: 'Work experience added successfully',
      updatedResume: updatedResume,
      addedExperience: newWorkExperience,
      // Format for frontend compatibility
      summary: structuredResume.Summary || "",
      skills: structuredResume["Technical Skills"] ? {
        technical_skills: structuredResume["Technical Skills"]
      } : {},
      work_experience: [
        newWorkExperience,
        ...structuredResume["Work Experience"].map(exp => ({
          company: exp.company,
          role: exp.role,
          title: exp.role,
          date_range: exp.date_range,
          dates: exp.date_range,
          accomplishments: exp.accomplishments,
          bullets: exp.accomplishments,
          location: ""
        }))
      ],
      education: structuredResume.Education?.map(edu => 
        `${edu.degree} from ${edu.institution} (${edu.graduation_date})`
      ) || [],
      certifications: structuredResume.Certifications || [],
      projects: structuredResume.Projects || [],
      contact_details: {
        name: "",
        email: "",
        phone_number: "",
        location: ""
      }
    };
  } catch (error: unknown) {
    console.error('Add experience service error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    return {
      success: false,
      message: errorMessage,
      updatedResume: null,
      addedExperience: {
        company: company || "",
        role: jobTitle || "",
        title: jobTitle || "",
        date_range: "Present",
        dates: "Present",
        accomplishments: [],
        bullets: [],
        location: ""
      },
      summary: "",
      skills: {},
      work_experience: [],
      education: [],
      certifications: [],
      projects: [],
      contact_details: {
        name: "",
        email: "",
        phone_number: "",
        location: ""
      }
    };
  }
}