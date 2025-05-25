import OpenAI from 'openai';

// Initialize OpenAI client
const openaiApiKey = process.env.OPENAI_API_KEY;
let openai: OpenAI | null = null;
if (openaiApiKey) {
  openai = new OpenAI({ apiKey: openaiApiKey });
}

/**
 * Analyzes job descriptions to extract required skills, experience levels, and qualifications
 */
export async function extract_job_requirements(jobDescription: string): Promise<{
  required_skills: string[];
  preferred_skills: string[];
  experience_level: string;
  education_requirements: string[];
  job_responsibilities: string[];
}> {
  if (!openai || jobDescription.trim().length < 50) {
    return {
      required_skills: [],
      preferred_skills: [],
      experience_level: "",
      education_requirements: [],
      job_responsibilities: []
    };
  }
  
  try {
    const prompt = `
    Analyze this job description and extract the following information:
    
    1. Required skills: Technical and soft skills explicitly stated as required
    2. Preferred skills: Skills mentioned as preferred, desired, or a plus
    3. Experience level: Years of experience required and seniority level
    4. Education requirements: Degrees, certifications, or education levels required
    5. Job responsibilities: Key duties and tasks for this role
    
    Return as a JSON object with these fields:
    - required_skills: array of strings
    - preferred_skills: array of strings
    - experience_level: string describing experience requirements
    - education_requirements: array of strings
    - job_responsibilities: array of strings
    
    Job Description:
    ${jobDescription}
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a job description analyzer that extracts structured information from job postings.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    try {
      const content = response.choices[0].message.content || '';
      const result = JSON.parse(content);
      
      return {
        required_skills: Array.isArray(result.required_skills) ? result.required_skills : [],
        preferred_skills: Array.isArray(result.preferred_skills) ? result.preferred_skills : [],
        experience_level: result.experience_level || "",
        education_requirements: Array.isArray(result.education_requirements) ? result.education_requirements : [],
        job_responsibilities: Array.isArray(result.job_responsibilities) ? result.job_responsibilities : []
      };
    } catch (parseError) {
      console.error("Failed to parse job requirements:", parseError);
      return {
        required_skills: [],
        preferred_skills: [],
        experience_level: "",
        education_requirements: [],
        job_responsibilities: []
      };
    }
  } catch (e) {
    console.error("Job requirements extraction error:", e);
    return {
      required_skills: [],
      preferred_skills: [],
      experience_level: "",
      education_requirements: [],
      job_responsibilities: []
    };
  }
}

/**
 * Identifies important keywords and phrases from a job description
 */
export async function extract_key_job_terms(jobDescription: string): Promise<{
  keywords: string[];
  industry: string;
  job_type: string;
  company_values: string[];
}> {
  if (!openai || jobDescription.trim().length < 50) {
    return {
      keywords: [],
      industry: "",
      job_type: "",
      company_values: []
    };
  }
  
  try {
    const prompt = `
    Extract key information from this job description:
    
    1. Keywords: Important technical terms, tools, methodologies, and industry-specific vocabulary
    2. Industry: The primary industry sector this job belongs to
    3. Job type: Full-time, part-time, contract, remote, hybrid, etc.
    4. Company values: Cultural values, mission statements, or workplace philosophies mentioned
    
    Return as a JSON object with these fields:
    - keywords: array of strings (important terms for matching)
    - industry: string (single industry name)
    - job_type: string (employment arrangement)
    - company_values: array of strings (cultural elements)
    
    Job Description:
    ${jobDescription}
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: 'You are a job description keyword extractor that identifies important terms for resume matching.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    try {
      const content = response.choices[0].message.content || '';
      const result = JSON.parse(content);
      
      return {
        keywords: Array.isArray(result.keywords) ? result.keywords : [],
        industry: result.industry || "",
        job_type: result.job_type || "",
        company_values: Array.isArray(result.company_values) ? result.company_values : []
      };
    } catch (parseError) {
      console.error("Failed to parse job terms:", parseError);
      return {
        keywords: [],
        industry: "",
        job_type: "",
        company_values: []
      };
    }
  } catch (e) {
    console.error("Job terms extraction error:", e);
    return {
      keywords: [],
      industry: "",
      job_type: "",
      company_values: []
    };
  }
} 