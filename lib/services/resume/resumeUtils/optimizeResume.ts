import OpenAI from 'openai';
import { extract_job_requirements, extract_key_job_terms } from './jobParser';
import { StructuredResume } from './resumeParser';

export interface OptimizedResume {
  optimized_text: string;
  summary?: string;
  work_experience?: Array<{
    company: string;
    title: string;
    dates: string;
    achievements: string[];
    bullets?: string[];
    accomplishments?: string[];
  }>;
  skills?: {
    technical_skills: string[];
    soft_skills: string[];
    industry_knowledge?: string[];
  };
  education?: Array<{
    institution: string;
    degree: string;
    graduation_date: string;
  }>;
  certifications?: string[];
  projects?: Array<{
    title: string;
    description: string;
    technologies?: string[];
  }>;
  note: string;
  openai_explanation?: string;
}

const openaiApiKey = process.env.OPENAI_API_KEY;
let openai: OpenAI | null = null;
if (openaiApiKey) {
  openai = new OpenAI({ apiKey: openaiApiKey });
}

// Manual extraction function for when JSON parsing fails
function extractStructuredDataManually(content: string): Partial<OptimizedResume> {
  const result: Partial<OptimizedResume> = {};
  
  try {
    // Extract work experience section manually
    const workExpMatch = content.match(/WORK EXPERIENCE[:\n]+([\s\S]*?)(?=\n(?:SKILLS|EDUCATION|$))/i);
    if (workExpMatch) {
      const workExpSection = workExpMatch[1];
      const experiences: Array<{
        company: string;
        title: string;
        dates: string;
        achievements: string[];
        bullets?: string[];
        accomplishments?: string[];
      }> = [];
      
      // Split by company/job entries (look for patterns like "Company Name" followed by dates)
      const jobEntries = workExpSection.split(/\n(?=[A-Z][^•\n]*(?:\d{4}|\w+\s+\d{4}))/);
      
      for (const entry of jobEntries) {
        if (entry.trim().length < 10) continue;
        
        const lines = entry.trim().split('\n');
        let company = '';
        let title = '';
        let dates = '';
        const achievements: string[] = [];
        
        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine) continue;
          
          // Check if it's a bullet point
          if (cleanLine.startsWith('•') || cleanLine.startsWith('-') || cleanLine.startsWith('*')) {
            const bulletText = cleanLine.replace(/^[•\-*]\s*/, '').trim();
            if (bulletText.length > 10) {
              achievements.push(bulletText);
            }
          } else if (!company && cleanLine.length > 5) {
            // First non-bullet line is likely company/title
            if (cleanLine.includes(' at ')) {
              const parts = cleanLine.split(' at ');
              title = parts[0].trim();
              company = parts[1].replace(/\s*\(\d{4}.*?\)/, '').trim();
            } else {
              company = cleanLine.replace(/\s*\(\d{4}.*?\)/, '').trim();
            }
          } else if (!title && cleanLine.length > 5 && !cleanLine.match(/\d{4}/)) {
            title = cleanLine.trim();
          } else if (cleanLine.match(/\d{4}/)) {
            dates = cleanLine.trim();
          }
        }
        
        if (company && achievements.length > 0) {
          experiences.push({
            company,
            title: title || '',
            dates: dates || '',
            // Include multiple field names for compatibility
            achievements,
            bullets: achievements,
            accomplishments: achievements
          });
        }
      }
      
      if (experiences.length > 0) {
        result.work_experience = experiences;
      }
    }
    
    // Extract skills section manually
    const skillsMatch = content.match(/(?:TECHNICAL\s+)?SKILLS[:\n]+([\s\S]*?)(?=\n(?:WORK|EDUCATION|$))/i);
    if (skillsMatch) {
      const skillsSection = skillsMatch[1];
      const technicalSkills: string[] = [];
      const softSkills: string[] = [];
      
      const skillLines = skillsSection.split('\n');
      let currentCategory = 'technical';
      
      for (const line of skillLines) {
        const cleanLine = line.trim();
        if (!cleanLine) continue;
        
        if (cleanLine.toLowerCase().includes('soft skill') || cleanLine.toLowerCase().includes('interpersonal')) {
          currentCategory = 'soft';
          continue;
        }
        
        if (cleanLine.startsWith('•') || cleanLine.startsWith('-') || cleanLine.startsWith('*')) {
          const skill = cleanLine.replace(/^[•\-*]\s*/, '').trim();
          if (skill.length > 1) {
            if (currentCategory === 'soft') {
              softSkills.push(skill);
            } else {
              technicalSkills.push(skill);
            }
          }
        } else if (cleanLine.includes(',')) {
          const skills = cleanLine.split(',').map(s => s.trim()).filter(s => s.length > 1);
          if (currentCategory === 'soft') {
            softSkills.push(...skills);
          } else {
            technicalSkills.push(...skills);
          }
        }
      }
      
      if (technicalSkills.length > 0 || softSkills.length > 0) {
        result.skills = {
          technical_skills: technicalSkills,
          soft_skills: softSkills
        };
      }
    }
    
    // Extract summary
    const summaryMatch = content.match(/(?:PROFESSIONAL\s+)?SUMMARY[:\n]+([\s\S]*?)(?=\n(?:WORK|SKILLS|EDUCATION|$))/i);
    if (summaryMatch) {
      const summary = summaryMatch[1].trim().replace(/\n+/g, ' ');
      if (summary.length > 20) {
        result.summary = summary;
      }
    }
    
    // Extract education section manually
    const educationMatch = content.match(/EDUCATION[:\n]+([\s\S]*?)(?=\n(?:WORK|SKILLS|CERTIFICATION|$))/i);
    if (educationMatch) {
      const educationSection = educationMatch[1];
      const educationItems: Array<{
        institution: string;
        degree: string;
        graduation_date: string;
      }> = [];
      
      // Split by education entries (look for patterns like degree names or institution names)
      const eduEntries = educationSection.split(/\n(?=[A-Z][^•\n]*(?:University|College|Institute|School|Bachelor|Master|PhD|\d{4}))/i);
      
      for (const entry of eduEntries) {
        if (entry.trim().length < 10) continue;
        
        const lines = entry.trim().split('\n').map(line => line.trim()).filter(line => line.length > 0);
        let institution = '';
        let degree = '';
        let graduation_date = '';
        
        for (const line of lines) {
          // Skip bullet points
          if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) continue;
          
          // Check if it contains a year (likely graduation date)
          if (line.match(/\d{4}/)) {
            graduation_date = line.trim();
          } else if (line.match(/(University|College|Institute|School)/i)) {
            institution = line.trim();
          } else if (line.match(/(Bachelor|Master|PhD|Degree|B\.S\.|M\.S\.|B\.A\.|M\.A\.)/i)) {
            degree = line.trim();
          } else if (!degree && line.length > 5) {
            // First non-institution line might be degree
            degree = line.trim();
          } else if (!institution && line.length > 10) {
            // Could be institution
            institution = line.trim();
          }
        }
        
        if (degree || institution) {
          educationItems.push({
            institution: institution || '',
            degree: degree || '',
            graduation_date: graduation_date || ''
          });
        }
      }
      
      if (educationItems.length > 0) {
        result.education = educationItems;
      }
    }
    
  } catch (error) {
    console.error("Error in manual extraction:", error);
  }
  
  return result;
}

export async function optimizeResume(resumeText: string, jobDescription: string, structuredResume?: StructuredResume | null, missingSkills?: string[]): Promise<OptimizedResume> {
  if (!openai) {
    return {
      optimized_text: resumeText,
      note: 'Optimization service unavailable. Please try again later.'
    };
  }
  
  try {
    // OPTIMIZATION: Parallelize job parsing to save 10-15 seconds
    const [jobRequirements, jobKeywords] = await Promise.all([
      extract_job_requirements(jobDescription),
      extract_key_job_terms(jobDescription)
    ]);
    
    // OPTIMIZATION: Streamlined prompt for faster processing while maintaining quality
    const missingSkillsSection = missingSkills && missingSkills.length > 0 ? `
    
    **CRITICAL: MISSING SKILLS TO INTEGRATE**
    The original resume analysis identified these missing skills that MUST be added:
    ${missingSkills.map(skill => `- ${skill}`).join('\n')}
    
    These skills MUST be:
    1. Added to the technical_skills or soft_skills sections
    2. Demonstrated in at least one work experience bullet point
    3. Naturally integrated into the professional summary
    
    The goal is to eliminate ALL missing skills from the original analysis.
    ` : '';

    const prompt = `
    Optimize this resume to match the job description. For each section:${missingSkillsSection}
    
    1. SUMMARY/PROFILE:
       Write a compelling 3-4 sentence professional summary that:
       - Presents the candidate as highly qualified for this exact role
       - Highlights 3-4 key skills that directly match the job requirements
       - Includes years of relevant experience appropriate for this position
       - Shows enthusiasm and career alignment with this specific position
    
    2. SKILLS:
       - Only include skills that are explicitly required or preferred in the job description, or that are industry-standard for this role.
       - Do NOT include any skills that are not relevant to the job description.
       - CRITICAL: Properly categorize skills into technical_skills and soft_skills:
         * TECHNICAL SKILLS: Tools, software, technologies, methodologies, standards, certifications, programming languages
         * SOFT SKILLS: Communication, leadership, teamwork, problem-solving, time management, client relations, collaboration
       - MANDATORY: You MUST have both technical_skills AND soft_skills sections with appropriate skills in each
       - The goal is to have ZERO irrelevant skills in the final resume.
    
    3. WORK EXPERIENCE:
       - IGNORE ALL ORIGINAL BULLET POINTS. Do NOT reuse or rephrase any previous achievements.
       - For each job, generate 5-6 NEW achievement bullet points that:
         - Demonstrate the specific skills and requirements listed in the job description.
         - Use strong action verbs and the STAR method ([ACTION VERB] + [HOW YOU USED THE SPECIFIC SKILL] + [QUANTIFIED BUSINESS IMPACT] + [SCALE/SCOPE]).
         - Include quantifiable metrics (percentages, dollar amounts, time savings, efficiency gains).
         - Each bullet MUST directly relate to a skill or requirement from the job description.
         - Do NOT include any achievements or skills that are not relevant to the job description.
       - If a required skill is not present in the candidate's background, create a realistic scenario where it could have been demonstrated in their role.
       - The final set of bullet points for each job should ONLY showcase skills and achievements that are directly relevant to the job description.
    
    4. EDUCATION & CERTIFICATIONS:
       **EDUCATION (MANDATORY - ALWAYS INCLUDE):**
       - MUST preserve ALL education entries from the original resume
       - Keep original institution names, degree titles, and graduation dates exactly as they appear
       - If graduation dates are missing, use "Year" as placeholder
       - If degree details are vague, keep them as-is rather than modifying
       - Education format: Institution Name, Degree Title, Graduation Year
       - NEVER skip or omit education entries that exist in the original resume
       
       **CERTIFICATIONS:**
       - Include ALL licenses, certifications, and credentials in this section
       - Professional licenses (e.g., "Professional Engineer License", "CPA License", "Medical License") belong here
       - Technical certifications (e.g., "AWS Certified Solutions Architect", "Microsoft Azure Certified", "PMP Certification") belong here
       - Driver's License: ONLY include if:
         * It is explicitly mentioned in the job description as required/preferred, OR
         * It is already present in the candidate's original resume
         * Do NOT add Driver's License if it's not job-relevant and not in the original resume
       - Industry certifications and credentials belong in this section
       - Any other licenses and professional qualifications belong here
       - IMPORTANT: These should NEVER appear in the skills sections
    
    5. PROJECTS (IMPORTANT - always include if present in original resume):
       - MANDATORY: If the original resume contains ANY projects, they MUST be included in the optimized version
       - For each project, enhance and optimize the content:
         - title: Keep original project title or improve it to be more descriptive
         - description: Rewrite description to highlight relevant skills and achievements for the target job
         - technologies: List all technologies used, ensuring they align with job requirements
       - Add metrics and quantifiable results where possible
       - Make project descriptions job-relevant by emphasizing skills that match the job posting
       - Return projects in this JSON format:
         [
           {
             "title": "enhanced project title",
             "description": "enhanced description with job-relevant details and achievements",
             "technologies": ["tech1", "tech2", "tech3"]
           }
         ]
    
    CRITICAL CATEGORIZATION RULES - FOLLOW THESE STRICTLY:
    - TECHNICAL SKILLS = Tools, technologies, software, programming languages, frameworks, methodologies, standards, industry knowledge (MAXIMUM 12 MOST RELEVANT)
    - SOFT SKILLS = Interpersonal and professional abilities like communication, leadership, problem-solving, teamwork, time management, client relations, collaboration (MINIMUM 3-5 SKILLS)
    - CERTIFICATIONS = ALL licenses, certifications, credentials, professional qualifications, any "Certified X" or "Licensed X"
    - MANDATORY RULE: Driver's License ONLY if explicitly required by job OR already in original resume
    - MANDATORY RULE: If something contains "License", "Certified", "Certification", or "Credential", it goes in Certifications, NOT Skills
    - MANDATORY RULE: Technical skills should be the actual technology/tool name (e.g., "AWS", "Python") not the certification (e.g., "AWS Certified")
    - MANDATORY RULE: You MUST include BOTH technical_skills AND soft_skills - never leave soft_skills empty
    - DOUBLE CHECK: Before adding anything to technical skills, ask "Is this a license or certification?" If yes, put it in Certifications
    - SKILL PRIORITIZATION: Choose only the 12 most job-relevant technical skills that make the strongest impact
    
    EXAMPLES OF PROPER CATEGORIZATION:
    - Technical: "Project Management", "ICAO Standards", "CAP168", "Design Software", "AutoCAD"
    - Soft: "Communication Skills", "Client Relationship Management", "Team Leadership", "Problem Solving", "Time Management"
    
    IMPORTANT FOR SKILLS: If the original resume has few or no skills listed, you MUST generate comprehensive technical and soft skills based on:
    - The work experience and roles held
    - The job description requirements
    - Industry standards for similar positions
    - Skills that would logically be needed for the accomplishments described
    
    Resume Text:
    ${resumeText}
    
    ${structuredResume ? `Structured Resume: ${JSON.stringify(structuredResume, null, 2)}` : ''}
    
    Job Description:
    ${jobDescription}
    
    Job Requirements:
    ${JSON.stringify(jobRequirements, null, 2)}
    
    Key Job Keywords:
    ${JSON.stringify(jobKeywords)}
    
    **FINAL OPTIMIZATION GOAL:**
    After optimization, this resume should score 90-100% when evaluated against this job description with ZERO missing skills. Every required skill, preferred skill, and relevant keyword should be:
    1. Listed in the technical or soft skills sections
    2. Demonstrated in at least one work experience bullet point or project
    3. Naturally integrated into the professional summary
    
    **RESPONSE FORMAT - EXTREMELY IMPORTANT:**
    
    First, provide the complete optimized resume in plain text format with professional formatting.
    
    Then, provide a JSON object with this EXACT structure:
    
    {
      "summary": "professional summary text here",
      "skills": {
        "technical_skills": ["Project Management", "ICAO Standards", "CAP168"],
        "soft_skills": ["Communication Skills", "Client Relationship Management", "Team Leadership"]
      },
      "work_experience": [
        {
          "company": "Company Name",
          "title": "Job Title", 
          "dates": "Employment Dates",
          "achievements": [
            "Achievement bullet point 1 with metrics",
            "Achievement bullet point 2 with metrics", 
            "Achievement bullet point 3 with metrics",
            "Achievement bullet point 4 with metrics",
            "Achievement bullet point 5 with metrics"
          ]
        }
      ],
      "education": [
        {
          "institution": "University/School Name",
          "degree": "Degree Title", 
          "graduation_date": "Graduation Year"
        }
      ],
      "certifications": ["cert1", "cert2"],
      "projects": [...]
    }
    
    **CRITICAL REQUIREMENTS:**
    - The work_experience array MUST contain an "achievements" field with 5-6 bullet points for each job
    - The education array MUST include ALL education from the original resume with "institution", "degree", and "graduation_date" fields
    - NEVER omit education entries that exist in the original resume
    `;
    
    // Enhanced response with the more powerful model
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', 
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert resume writer and career coach. Your specialty is creating achievement-focused bullet points that demonstrate specific skills through quantifiable accomplishments. For EVERY work experience entry, you MUST generate 5-6 bullet points that showcase job-relevant skills with metrics and results. CRITICAL: You MUST properly categorize skills into both technical_skills AND soft_skills - never leave soft_skills empty. Communication, leadership, teamwork, client relations, and time management are soft skills.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 4000, // Optimize token usage for faster response
    }, {
      timeout: 60000, // Reduced to 60 seconds for faster response
    });
    
    const content = response.choices[0].message.content || '';
    
    // Validate that we got actual content
    if (!content || content.trim().length < 100) {
      throw new Error('OpenAI returned insufficient content for optimization');
    }
    
    // Extract structured data if available (JSON content)
    let structuredData = {};
    try {
      // Try to find JSON content between triple backticks or at the end
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                        content.match(/```\n([\s\S]*?)\n```/) || 
                        content.match(/{[\s\S]*}/);
      
      if (jsonMatch) {
        let jsonContent = jsonMatch[0].replace(/```json\n|```\n|```/g, '');
        
        // Clean the JSON content before parsing - ONLY remove markdown formatting
        jsonContent = jsonContent.trim();
        
        // Validate JSON content before parsing
        if (!jsonContent || jsonContent.length < 10) {
          console.warn("JSON content too short or empty:", jsonContent.length);
        } else {
          // Attempt to parse the JSON content directly
          const parsed = JSON.parse(jsonContent);
          
          // Validate the parsed result
          if (typeof parsed === 'object' && parsed !== null) {
            structuredData = parsed;
          } else {
            console.warn("Parsed JSON is not a valid object:", typeof parsed);
          }
        }
      } else {
        console.warn("No JSON content found in OpenAI response");
      }
    } catch (parseError) {
      console.error("Failed to parse structured data:", {
        error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        position: parseError instanceof SyntaxError && 'position' in parseError ? parseError.position : 'unknown',
        contentPreview: content.substring(0, 1000) + '...' // First 1000 chars for debugging
      });
      
      // Try to extract work experience manually if JSON parsing fails
      try {
        const manuallyExtracted = extractStructuredDataManually(content);
        if (manuallyExtracted && Object.keys(manuallyExtracted).length > 0) {
          structuredData = manuallyExtracted;
        }
      } catch (manualError) {
        console.error("Manual extraction also failed:", manualError);
      }
    }
    
    // Extract the plain text resume content
    const plainTextResume = content.replace(/```json\n[\s\S]*?\n```/g, '').trim();
    
    // Ensure structured data has proper format
    const finalStructuredData = { ...structuredData as Partial<OptimizedResume> };
    

    
    // Normalize work experience data format without fallbacks
    if (finalStructuredData.work_experience && Array.isArray(finalStructuredData.work_experience)) {
      finalStructuredData.work_experience = finalStructuredData.work_experience.map((exp: unknown) => {
        const expData = exp as Record<string, unknown>;
        // Get actual bullets without fallbacks
        const bullets = (expData.achievements || expData.bullets || expData.accomplishments || []) as string[];
        

        
        return {
          company: (expData.company as string) || '',
          title: (expData.title as string) || (expData.role as string) || '',
          dates: (expData.dates as string) || (expData.date_range as string) || '',
          // Return actual data in multiple formats for compatibility
          achievements: bullets,
          bullets: bullets,
          accomplishments: bullets
        };
      });
    }
    
    // Normalize education format without fallbacks
    if (finalStructuredData.education && Array.isArray(finalStructuredData.education)) {

      finalStructuredData.education = finalStructuredData.education.map((edu: unknown) => {
        const eduData = edu as Record<string, unknown>;
        return {
          institution: (eduData.institution as string) || (eduData.school as string) || '',
          degree: (eduData.degree as string) || '',
          graduation_date: (eduData.graduation_date as string) || (eduData.dates as string) || ''
        };
      });
    } else {
      console.warn("No education data found in structured response");
    }
    
    // Check if we got valid structured data
    if (!finalStructuredData || Object.keys(finalStructuredData).length === 0) {
      console.error("CRITICAL: No structured data was parsed from OpenAI response");
      const extractedFromText = extractStructuredDataManually(plainTextResume);
      if (Object.keys(extractedFromText).length > 0) {
        Object.assign(finalStructuredData, extractedFromText);
      } else {
        console.error("Manual extraction also failed - no data could be extracted");
      }
    }
    
    // Log final data state for debugging
    if (!finalStructuredData.work_experience || finalStructuredData.work_experience.length === 0) {
      console.error("ISSUE: No work experience data in final structured data");
    }
    
    if (!finalStructuredData.education || finalStructuredData.education.length === 0) {
      console.error("ISSUE: No education data in final structured data");
    }
    
    // Validate that optimization achieved the goal of zero missing skills
    const optimizedResume = {
      optimized_text: plainTextResume,
      ...finalStructuredData,
      note: 'Resume optimized to eliminate missing skills and perfectly match job requirements',
      openai_explanation: 'Your resume has been enhanced with all job-required skills and demonstrates them through specific achievements. This should result in zero missing skills when scored.'
    };

    // Quick validation: Check if key job requirements are present in the optimized text
    const lowercaseResume = plainTextResume.toLowerCase();
    const missingCriticalSkills = [];
    
    // Check required skills
    for (const skill of jobRequirements.required_skills) {
      if (!lowercaseResume.includes(skill.toLowerCase())) {
        missingCriticalSkills.push(skill);
      }
    }
    
    // Log warning if critical skills are still missing
    if (missingCriticalSkills.length > 0) {
      console.warn('Warning: Some critical skills may still be missing from optimized resume:', missingCriticalSkills);
      optimizedResume.note += ` Note: Please verify that these skills are adequately represented: ${missingCriticalSkills.join(', ')}`;
    }
    
    return optimizedResume;
  } catch (error) {
    console.error("OpenAI optimization error:", error);
    return {
      optimized_text: resumeText,
      note: 'An error occurred during optimization. Original resume returned.'
    };
  }
} 