import OpenAI from 'openai';

const openaiApiKey = process.env.OPENAI_API_KEY;
let openai: OpenAI | null = null;
if (openaiApiKey) {
  openai = new OpenAI({ apiKey: openaiApiKey });
}

export interface WorkExperience {
  company: string;
  title: string;
  dateRange: string;
}

export interface Education {
  institution: string;
  degree: string;
  graduationDate: string;
}

export interface Project {
  title: string;
  description: string;
  technologies: string;
}

interface GeneratedWorkExperience {
  company: string;
  title: string;
  dates: string;
  achievements: string[];
}

export interface CreateResumeRequest {
  // Personal Information
  fullName: string;
  email: string;
  phoneNumber: string;
  location: string;
  // Job and Content
  jobDescription: string;
  currentSummary?: string;
  workExperience: WorkExperience[];
  education?: Education[];
  projects?: Project[];
  certifications?: string;
  licenses?: string;
}

export interface ResumeData {
  summary: string;
  skills: {
    technical_skills: string[];
    soft_skills: string[];
  };
  work_experience: Array<{
    company: string;
    title: string;
    role: string;
    dates: string;
    date_range: string;
    accomplishments: string[];
    bullets: string[];
  }>;
  education: Array<{
    school: string;
    degree: string;
    dates: string;
    institution: string;
    graduation_date: string;
  }>;
  projects: Array<{
    title: string;
    description: string;
    technologies: string[];
  }>;
  certifications: string[];
  contact_details?: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
}

export interface CreateResumeResponse {
  success: boolean;
  resume?: ResumeData;
  message?: string;
  error?: string;
}

export async function createResumeFromScratch(data: CreateResumeRequest): Promise<CreateResumeResponse> {
  try {
    const { 
      fullName,
      email,
      phoneNumber,
      location,
      jobDescription, 
      currentSummary, 
      workExperience, 
      education = [], 
      projects = [], 
      certifications, 
      licenses 
    } = data;

    // Validate required fields
    if (!jobDescription || !workExperience || !Array.isArray(workExperience) || workExperience.length === 0) {
      return {
        success: false,
        error: 'Missing required fields. Please provide jobDescription and at least one work experience.'
      };
    }

    // Validate work experience entries
    const validWorkExperience = workExperience.filter((exp: WorkExperience) => 
      exp.company && exp.title && exp.dateRange
    );

    if (validWorkExperience.length === 0) {
      return {
        success: false,
        error: 'Please provide complete information for at least one work experience (company, title, and date range).'
      };
    }

    if (!openai) {
      return {
        success: false,
        error: 'OpenAI service unavailable. Please try again later.'
      };
    }

    // Filter provided data
    const validEducation = education?.filter((edu: Education) => edu.institution || edu.degree) || [];
    const validProjects = projects?.filter((proj: Project) => proj.title || proj.description) || [];

    const prompt = `
You are an expert resume writer and career coach. Using the following information, generate ONLY a professional summary, skills, and achievements for each work experience.

INPUT INFORMATION:
- Job Description: ${jobDescription}
- Current Summary: ${currentSummary || 'Not provided'}
- Work Experience: ${JSON.stringify(validWorkExperience)}
- Education: ${validEducation.length > 0 ? JSON.stringify(validEducation) : 'Not provided'}
- Projects: ${validProjects.length > 0 ? JSON.stringify(validProjects) : 'Not provided'}
- Certifications: ${certifications || 'Not provided'}
- Licenses: ${licenses || 'Not provided'}

TASK: Generate ONLY the following sections (do NOT generate education, certifications, or projects - user will provide those):

1. PROFESSIONAL SUMMARY:
   - Write a compelling 3-4 sentence summary highlighting expertise relevant to the job description
   - Include years of experience that would be appropriate for this role level
   - Emphasize key skills and value proposition that align with the job requirements

2. TECHNICAL SKILLS:
   - Extract all technical skills, tools, software, and technologies mentioned in the job description
   - Add industry-standard skills that would typically be required for this type of role
   - Include programming languages, frameworks, tools, and methodologies relevant to the position
   - Limit to 12-15 most relevant technical skills

3. SOFT SKILLS:
   - Include interpersonal skills like communication, leadership, problem-solving, teamwork
   - Base these on what would be needed for the job description requirements
   - Limit to 6-8 key soft skills

4. WORK EXPERIENCE ACHIEVEMENTS:
   - For EACH work experience provided, generate 5-6 achievement-focused bullet points using the STAR method based on the job description
   -  **IMPORTANT** Each bullet should demonstrate skills mentioned in the job description
   - Include quantifiable metrics (percentages, dollar amounts, time savings, team sizes)
   - Focus on accomplishments that directly relate to the job requirements
   - Use the exact company names, job titles, and date ranges provided by the user

   *IMPORTANT*
   -  do not just say  Led a project that integrated machine learning algorithms, resulting in a 40% increase in data processing efficiency,
    should have more depth to the bullet points. be more specific on what was used, in the action in STAR method. 

  - don't just day data visualization tools, it can be like data visualization tools like tableau, power bi, etc.

  
   

RESPONSE FORMAT:
Return ONLY a valid JSON object with this exact structure:

{
  "summary": "Professional summary text here",
  "skills": {
    "technical_skills": ["skill1", "skill2", "skill3"],
    "soft_skills": ["skill1", "skill2", "skill3"]
  },
  "work_experience": [
    {
      "company": "Exact company name from user input",
      "title": "Exact job title from user input",
      "dates": "Exact date range from user input",
      "achievements": [
        "Achievement bullet point 1 with metrics and impact",
        "Achievement bullet point 2 with metrics and impact",
        "Achievement bullet point 3 with metrics and impact",
        "Achievement bullet point 4 with metrics and impact",
        "Achievement bullet point 5 with metrics and impact",
        "Achievement bullet point 6 with metrics and impact"
      ]
    }
  ]
}

IMPORTANT: Return ONLY the JSON object, no additional text or explanation.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert resume writer specializing in creating achievement-focused resumes that perfectly match job requirements. Always return valid JSON only.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 3000,
    });

    const content = response.choices[0].message.content || '';
    
    // Validate that we got actual content
    if (!content || content.trim().length < 50) {
      throw new Error('OpenAI returned insufficient content for resume generation');
    }

    // Try to parse the JSON response
    let resumeData;
    try {
      // Clean the content and try to parse as JSON
      const cleanedContent = content.trim();
      
      // Try to extract JSON if it's wrapped in markdown
      const jsonMatch = cleanedContent.match(/```json\n([\s\S]*?)\n```/) || 
                        cleanedContent.match(/```\n([\s\S]*?)\n```/) || 
                        cleanedContent.match(/{[\s\S]*}/);
      
      const jsonContent = jsonMatch ? jsonMatch[1] || jsonMatch[0] : cleanedContent;
      resumeData = JSON.parse(jsonContent);
      
      // Validate the structure
      if (!resumeData || typeof resumeData !== 'object') {
        throw new Error('Invalid JSON structure returned');
      }
      
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.error('Raw response:', content);
      
      return {
        success: false,
        error: 'Failed to generate structured resume data. Please try again.',
      };
    }

    // Transform user education data to match ResumeData format
    const transformedEducation = validEducation.map((edu: Education) => ({
      school: edu.institution,
      degree: edu.degree,
      dates: edu.graduationDate,
      institution: edu.institution,
      graduation_date: edu.graduationDate
    }));

    // Transform user projects data to match ResumeData format
    const transformedProjects = validProjects.map((proj: Project) => ({
      title: proj.title,
      description: proj.description,
      technologies: proj.technologies ? proj.technologies.split(',').map(tech => tech.trim()).filter(tech => tech) : []
    }));

    // Transform certifications to array format
    const transformedCertifications = certifications ? 
      certifications.split(/[,\n]/).map((cert: string) => cert.trim()).filter((cert: string) => cert) : [];

    // Transform licenses to array format (add to certifications for now)
    const transformedLicenses = licenses ? 
      licenses.split(/[,\n]/).map((license: string) => license.trim()).filter((license: string) => license) : [];

    // Combine certifications and licenses
    const allCertifications = [...transformedCertifications, ...transformedLicenses];

    // Ensure required fields are present with defaults and proper structure
    const finalResume = {
      summary: resumeData.summary || 'Professional with extensive experience in the field.',
      skills: {
        technical_skills: resumeData.skills?.technical_skills || [],
        soft_skills: resumeData.skills?.soft_skills || []
      },
      work_experience: resumeData.work_experience ? 
        resumeData.work_experience.map((genExp: GeneratedWorkExperience, index: number) => ({
          company: genExp.company || validWorkExperience[index]?.company || '',
          title: genExp.title || validWorkExperience[index]?.title || '',
          role: genExp.title || validWorkExperience[index]?.title || '',
          dates: genExp.dates || validWorkExperience[index]?.dateRange || '',
          date_range: genExp.dates || validWorkExperience[index]?.dateRange || '',
          accomplishments: genExp.achievements || ['Led key initiatives and delivered results.'],
          bullets: genExp.achievements || ['Led key initiatives and delivered results.']
        })) : 
        validWorkExperience.map((exp: WorkExperience) => ({
          company: exp.company,
          title: exp.title,
          role: exp.title,
          dates: exp.dateRange,
          date_range: exp.dateRange,
          accomplishments: ['Led key initiatives and delivered results.'],
          bullets: ['Led key initiatives and delivered results.']
        })),
      education: transformedEducation,
      projects: transformedProjects,
      certifications: allCertifications,
      contact_details: {
        name: fullName || '',
        email: email || '',
        phone: phoneNumber || '',
        location: location || ''
      }
    };

    return {
      success: true,
      resume: finalResume,
      message: 'Resume content generated successfully'
    };

  } catch (error) {
    console.error('Resume creation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred during resume generation'
    };
  }
}
