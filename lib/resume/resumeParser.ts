import OpenAI from 'openai';

// Initialize OpenAI client
const openaiApiKey = process.env.OPENAI_API_KEY;
let openai: OpenAI | null = null;
if (openaiApiKey) {
  openai = new OpenAI({ apiKey: openaiApiKey });
}

/**
 * Interface for structured resume data
 */
export interface StructuredResume {
  Summary: string;
  "Work Experience": Array<{
    company: string;
    role: string;
    date_range: string;
    accomplishments: string[];
  }>;
  "Technical Skills": string[];
  Education: Array<{
    institution: string;
    degree: string;
    graduation_date: string;
  }>;
  Certifications: string[];
  Projects: string[];
}

/**
 * Identifies and separates different resume sections
 */
export async function segment_resume_sections(text: string): Promise<Record<string, string>> {
  if (!openai) {
    return { "Full Resume": text };
  }
  
  try {
    // Truncate extremely long text to prevent JSON parsing issues
    const maxLength = 15000; // 15k characters should be sufficient for most resumes
    const truncatedText = text.length > maxLength 
      ? text.substring(0, maxLength) + "...\n[Text truncated for processing]"
      : text;
    
    const prompt = `
    Identify all distinct sections in this resume and extract each section's content.
    
    For each section:
    1. Identify the section title (e.g., "Work Experience", "Skills", "Education")
    2. Extract the entire section's content
    
    Return as JSON with section titles as keys and section content as values.
    Make sure to properly escape all JSON strings and avoid unterminated strings.
    
    Resume:
    ${truncatedText}
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a resume section extractor. Always return valid JSON with properly escaped strings.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    // Try to parse the result with better error handling
    try {
      const content = response.choices[0].message.content || '';
      
      // Validate that we have content
      if (!content.trim()) {
        console.warn("Empty response from OpenAI for resume segmentation");
        return { "Full Resume": text };
      }
      
      // Clean the content before parsing
      let cleanContent = content.trim();
      
      // Remove any potential markdown formatting
      cleanContent = cleanContent.replace(/```json\n?|```\n?/g, '');
      
      // Try to fix common JSON issues
      cleanContent = cleanContent.replace(/\n/g, '\\n');
      cleanContent = cleanContent.replace(/\r/g, '\\r');
      cleanContent = cleanContent.replace(/\t/g, '\\t');
      
      // Attempt to parse
      const parsed = JSON.parse(cleanContent);
      
      // Validate the result is an object
      if (typeof parsed !== 'object' || parsed === null) {
        console.warn("Invalid parsed result from OpenAI:", typeof parsed);
        return { "Full Resume": text };
      }
      
      return parsed;
    } catch (parseError) {
      console.error("Failed to parse resume segmentation:", {
        error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        content: response.choices[0].message.content?.substring(0, 500) + '...' // First 500 chars for debugging
      });
      // Return a basic object with the full text
      return { "Full Resume": text };
    }
  } catch (e) {
    console.error("Resume segmentation error:", e instanceof Error ? e.message : 'Unknown error');
    return { "Full Resume": text };
  }
}

/**
 * Organizes raw resume text into structured JSON with sections for summary, work experience, skills, education, etc.
 */
export async function structure_resume(text: string): Promise<StructuredResume> {
  if (!openai) {

    return { 
      Summary: "",
      "Work Experience": [],
      "Technical Skills": [],
      Education: [],
      Certifications: [],
      Projects: []
    };
  }
  
  try {
    // First segment the resume into sections
    const sections = await segment_resume_sections(text);
    
    // Ensure we have valid sections data and truncate if necessary
    let sectionsData = sections;
    const sectionsString = JSON.stringify(sections, null, 2);
    const maxSectionsLength = 10000;
    
    if (sectionsString.length > maxSectionsLength) {
      console.warn("Sections data too large, using full resume text instead");
      sectionsData = { "Full Resume": text.substring(0, 8000) + "...\n[Text truncated for processing]" };
    }
    
    const prompt = `
    Convert this resume into a structured JSON format with the following fields:
    - Summary: A brief professional summary
    - Work Experience: Array of work experiences, each with {company, role, date_range, accomplishments}
    - Technical Skills: Array of professional skills (DO NOT include licenses, certifications, or credentials here)
    - Education: Array of education entries, each with {institution, degree, graduation_date}
    - Certifications: Array of certifications, licenses, or credentials (include all licenses here)
    - Projects: Array of project descriptions
    
    IMPORTANT INSTRUCTIONS:
    - Skills should ONLY include actual abilities, tools, technologies, programming languages, and methodologies
    - Licenses (Professional License, Driver's License, etc.) should go in Certifications, NOT Skills
    - Certifications and credentials should go in Certifications, NOT Skills
    - Do NOT mix licenses/certifications with skills
    
    Parse from these resume sections:
    ${JSON.stringify(sectionsData, null, 2)}
    
    Follow this exact structure:
    {
      "Summary": "Professional summary text...",
      
      "Work Experience": [
        {
          "company": "Company Name",
          "role": "Job Title",
          "date_range": "Start Date - End Date",
          "accomplishments": ["Achievement 1", "Achievement 2", "..."]
        }
      ],
      
      "Technical Skills": ["Skill 1", "Skill 2", "..."],
      
      "Education": [
        {
          "institution": "University Name",
          "degree": "Degree Name",
          "graduation_date": "Date"
        }
      ],
      
      "Certifications": ["Certification 1", "License 1", "Credential 1", "..."],
      
      "Projects": ["Project 1", "Project 2", "..."]
    }
    
    If any information is missing, include the field but leave it as an empty string or empty array.
    Return only the JSON object without any explanations.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are an AI resume parser that extracts structured information from resumes accurately.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    try {
      const content = response.choices[0].message.content || '';
      
      // Validate that we have content
      if (!content.trim()) {
        console.warn("Empty response from OpenAI for resume structuring");
        return { 
          Summary: "",
          "Work Experience": [],
          "Technical Skills": [],
          Education: [],
          Certifications: [],
          Projects: []
        };
      }
      
      // Clean the content before parsing
      let cleanContent = content.trim();
      
      // Remove any potential markdown formatting
      cleanContent = cleanContent.replace(/```json\n?|```\n?/g, '');
      
      // Try to fix common JSON issues
      cleanContent = cleanContent.replace(/\n/g, '\\n');
      cleanContent = cleanContent.replace(/\r/g, '\\r');
      cleanContent = cleanContent.replace(/\t/g, '\\t');
      
      // Attempt to parse
      const parsed = JSON.parse(cleanContent);
      
      // Validate the result has the expected structure
      if (typeof parsed !== 'object' || parsed === null) {
        console.warn("Invalid parsed result from OpenAI:", typeof parsed);
        return { 
          Summary: "",
          "Work Experience": [],
          "Technical Skills": [],
          Education: [],
          Certifications: [],
          Projects: []
        };
      }
      
      // Ensure all required fields exist with proper defaults
      return {
        Summary: parsed.Summary || "",
        "Work Experience": Array.isArray(parsed["Work Experience"]) ? parsed["Work Experience"] : [],
        "Technical Skills": Array.isArray(parsed["Technical Skills"]) ? parsed["Technical Skills"] : [],
        Education: Array.isArray(parsed.Education) ? parsed.Education : [],
        Certifications: Array.isArray(parsed.Certifications) ? parsed.Certifications : [],
        Projects: Array.isArray(parsed.Projects) ? parsed.Projects : []
      };
    } catch (parseError) {
      console.error("Failed to parse structured resume:", {
        error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        content: response.choices[0].message.content?.substring(0, 500) + '...' // First 500 chars for debugging
      });
      return { 
        Summary: "",
        "Work Experience": [],
        "Technical Skills": [],
        Education: [],
        Certifications: [],
        Projects: []
      };
    }
  } catch (e) {
    console.error("Resume structuring error:", e);
    return { 
      Summary: "",
      "Work Experience": [],
      "Technical Skills": [],
      Education: [],
      Certifications: [],
      Projects: []
    };
  }
}

/**
 * Extracts professional skills from resume text using AI
 */
export async function extract_skills_from_text(text: string): Promise<string[]> {
  if (!openai) {

    return [];
  }
  
  try {
    // First segment the resume to find skills section
    const sections = await segment_resume_sections(text);
    
    // Build a context containing skills-related sections and some experience
    let contextText = "";
    
    // Add skills sections
    for (const key of ["Skills", "Technical Skills", "Areas of Expertise", "Additional Skills"]) {
      if (sections[key]) {
        contextText += `${key}:\n${sections[key]}\n\n`;
      }
    }
    
    // Add experience for implied skills
    for (const key of ["Professional Experience", "Experience", "Work Experience"]) {
      if (sections[key]) {
        contextText += `${key}:\n${sections[key]}\n\n`;
      }
    }
    
    // If we didn't find specific sections, use the whole resume
    if (contextText.length < 100) {
      contextText = text;
    }
    
    const prompt = `
    Extract all professional skills from this resume text. Include both hard skills (technical) and soft skills.
    
    IMPORTANT: Only extract actual SKILLS, not licenses, certifications, or credentials.
    
    Include:
    - Technical skills (programming languages, software, tools, technologies)
    - Methodologies and frameworks  
    - Soft skills (communication, leadership, problem-solving)
    - Professional abilities and competencies
    
    Exclude:
    - Licenses (Professional License, Driver's License, etc.)
    - Certifications (Certified X, PMP, etc.)
    - Credentials and degrees
    - Awards and recognitions
    
    For each skill:
    1. Convert to professional resume format (e.g., "make time for others" → "supportiveness" or "active listening")
    2. Use standard industry terminology
    3. Remove duplicates and consolidate similar skills
    
    Return a JSON array containing only the list of skills as strings. 
    DO NOT include additional text, explanations, or categorizations.
    
    Resume text:
    ${contextText}
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a resume skills extractor that identifies professional skills from resume text.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    try {
      const content = response.choices[0].message.content || '';
      const result = JSON.parse(content);
      return Array.isArray(result.skills) ? result.skills : [];
    } catch (parseError) {
      console.error("Failed to parse skills extraction:", parseError);
      return [];
    }
  } catch (e) {
    console.error("Skills extraction error:", e);
    return [];
  }
} 