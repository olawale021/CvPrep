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
          - Ensure all technical keywords from the job description are included
          - IMPORTANT: Always include a well-populated list of technical skills
          - Generate a complete list of technical skills NECESSARY for this job
          - Include software, tools, platforms, and methodologies required
       
       b) Soft Skills:
          - List interpersonal and professional skills essential for success in this role
          - Include leadership, communication, or team skills mentioned in the job posting
          - Add relevant traits like problem-solving, adaptability, attention to detail
    
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
    
    5. PROJECTS (if any):
       - For each project, return an object with:
         - title: string
         - description: string
         - technologies: string[] (if available)
    
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
    });
    
    const content = response.choices[0].message.content || '';
    
    // Extract structured data if available (JSON content)
    let structuredData = {};
    try {
      // Try to find JSON content between triple backticks or at the end
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                        content.match(/```\n([\s\S]*?)\n```/) || 
                        content.match(/{[\s\S]*}/);
      
      if (jsonMatch) {
        const jsonContent = jsonMatch[0].replace(/```json\n|```\n|```/g, '');
        structuredData = JSON.parse(jsonContent);
      }
    } catch (parseError) {
      console.error("Failed to parse structured data:", parseError);
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