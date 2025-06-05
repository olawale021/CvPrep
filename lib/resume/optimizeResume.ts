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

export async function optimizeResume(resumeText: string, jobDescription: string, structuredResume?: StructuredResume): Promise<OptimizedResume> {
  if (!openai) {
    return {
      optimized_text: resumeText,
      note: 'Optimization service unavailable. Please try again later.'
    };
  }
  
  try {
    // Get job requirements to enhance optimization
    const jobRequirements = await extract_job_requirements(jobDescription);
    const jobKeywords = await extract_key_job_terms(jobDescription);
    
    // Create a more sophisticated prompt based on the Python implementation
    const prompt = `
    Optimize this resume to match the job description. For each section:
    
    1. SUMMARY/PROFILE:
       Write a compelling 3-4 sentence professional summary that:
       - Presents the candidate as highly qualified for this exact role
       - Highlights 3-4 key skills that directly match the job requirements
       - Includes years of relevant experience appropriate for this position
       - Shows enthusiasm and career alignment with this specific position
    
    2. SKILLS (create comprehensive bullet-point lists):
       a) Technical Skills:
          - Return a flat array of individual skills, tools, technologies, and methodologies (NO category prefixes like "Programming Languages:", "Frameworks:", etc.)
          - Only list the skill/technology name, e.g., "Java 11+", "Spring Boot", "Kafka", "AWS", "Docker"
          - CRITICAL: SKILLS should ONLY include actual abilities, tools, technologies, programming languages, software, frameworks, and methodologies
          - ABSOLUTELY NEVER include ANY licenses, certifications, credentials, or professional qualifications in technical skills
          - Examples of what SHOULD be in technical skills: "Python", "React", "AWS", "Machine Learning", "Agile", "Docker", "SQL", "JavaScript", "Kubernetes"
          - Examples of what should NEVER be in technical skills: "Driver's License", "Professional Engineer License", "CPA", "AWS Certified Solutions Architect", "PMP Certified", "CDL License", "Medical License"
          - WARNING: If you see "License", "Certified", "Certification", or "Credential" anywhere in the text, it does NOT belong in skills
          - Driver's License specifically belongs in Certifications, NOT in technical skills
          - MAXIMUM 12 TECHNICAL SKILLS - Focus on the MOST RELEVANT skills for this specific job
          - Prioritize skills in this order:
            1. Skills explicitly mentioned in the job description
            2. Skills from the candidate's work experience that match job requirements
            3. Industry-standard tools and technologies critical for this specific role
          - Quality over quantity - choose the 12 most impactful skills that make the candidate appear perfectly qualified
          - Include software, tools, platforms, frameworks, and methodologies most relevant to the position
          - If the original resume has skills, prioritize those that are relevant, then add job-specific ones to reach 12 maximum
       
       b) Soft Skills:
          - List 8-12 interpersonal and professional skills essential for success in this role
          - Include leadership, communication, or team skills mentioned in the job posting
          - Add relevant traits like problem-solving, adaptability, attention to detail
          - Base soft skills on the work experience and job requirements
          - Examples: "Leadership", "Communication", "Problem Solving", "Team Collaboration", "Project Management", "Critical Thinking"
          - NEVER include licenses, certifications, or credentials here (including Driver's License)
    
    3. WORK EXPERIENCE:
       Keep the original job titles, companies, and dates, but:
       - Create 5-6 ENTIRELY NEW achievement-focused bullet points for each position
       - Begin each with a STRONG ACTION VERB appropriate for the industry
       - Structure bullets as: ACTION + JOB-RELEVANT TASK + IMPRESSIVE RESULT
       - Include specific metrics and quantifiable achievements (%, $, efficiency)
       - DIRECTLY incorporate keywords and requirements from the job description
       - Make each bullet point DIRECTLY relevant to the target job skills and duties
       - Bullet points should be at least 5 for each position
    
    4. EDUCATION & CERTIFICATIONS:
       - Keep original education but highlight relevance to the position
       - For certifications: Include ALL licenses, certifications, and credentials in this section
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
    - TECHNICAL SKILLS = ONLY abilities, tools, technologies, software, programming languages, frameworks, methodologies (MAXIMUM 12 MOST RELEVANT)
    - SOFT SKILLS = ONLY interpersonal and professional abilities like communication, leadership, problem-solving
    - CERTIFICATIONS = ALL licenses, certifications, credentials, professional qualifications, any "Certified X" or "Licensed X"
    - MANDATORY RULE: Driver's License ONLY if explicitly required by job OR already in original resume
    - MANDATORY RULE: If something contains "License", "Certified", "Certification", or "Credential", it goes in Certifications, NOT Skills
    - MANDATORY RULE: Technical skills should be the actual technology/tool name (e.g., "AWS", "Python") not the certification (e.g., "AWS Certified")
    - DOUBLE CHECK: Before adding anything to technical skills, ask "Is this a license or certification?" If yes, put it in Certifications
    - SKILL PRIORITIZATION: Choose only the 12 most job-relevant technical skills that make the strongest impact
    
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
    
    Return the optimized resume in plain text format, maintaining professional formatting.
    Also return a JSON object with the structured data for each section.
    For the JSON structure, use this format:
    {
      "summary": "professional summary...",
      "skills": {
        "technical_skills": ["skill1", "skill2", ...],
        "soft_skills": ["skill1", "skill2", ...]
      },
      "work_experience": [...],
      "education": [...],
      "certifications": [...],
      "projects": [...]
    }
    `;
    
    // Enhanced response with the more powerful model
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using the equivalent of the Python code's model
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert in creating optimized resumes that perfectly match job requirements. Your specialty is enhancing resumes with relevant skills and accomplishments that make candidates appear highly qualified for specific positions.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
    }, {
      timeout: 90000, // 90 seconds timeout for Vercel
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
        
        // DON'T manually escape characters - this causes double-escaping issues
        // The following lines were causing JSON parsing failures:
        // jsonContent = jsonContent.replace(/\n/g, '\\n');
        // jsonContent = jsonContent.replace(/\r/g, '\\r');
        // jsonContent = jsonContent.replace(/\t/g, '\\t');
        
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
    }
    
    // Extract the plain text resume content
    const plainTextResume = content.replace(/```json\n[\s\S]*?\n```/g, '').trim();
    
    return {
      optimized_text: plainTextResume,
      ...(structuredData as Partial<OptimizedResume>),
      note: 'Resume optimized to better match the job description using advanced AI',
      openai_explanation: 'Your resume has been rewritten to highlight skills and experiences most relevant to the job requirements.'
    };
  } catch (error) {
    console.error("OpenAI optimization error:", error);
    return {
      optimized_text: resumeText,
      note: 'An error occurred during optimization. Original resume returned.'
    };
  }
} 