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
    You are an expert resume parser that can handle ANY resume format and style.
    
    Your task: Identify ALL distinct sections in this resume and extract each section's complete content.
    
    IMPORTANT - Handle ALL resume formats:
    - Traditional chronological resumes
    - Modern functional resumes  
    - Creative resumes with unique formatting
    - Resumes with bullet points, dashes, or other markers
    - Resumes with headers like "**SECTION**", "SECTION:", "--- SECTION ---", etc.
    - Multi-column layouts
    - Resumes with mixed formatting styles
    
    Section Detection Rules:
    1. Look for ANY text that acts as a section header (could be bold, caps, underlined, or separated)
    2. Common section patterns to recognize:
       - SUMMARY / PROFESSIONAL SUMMARY / OBJECTIVE / PROFILE
       - WORK EXPERIENCE / EXPERIENCE / EMPLOYMENT / PROFESSIONAL EXPERIENCE / CAREER HISTORY
       - EDUCATION / ACADEMIC BACKGROUND / QUALIFICATIONS
       - SKILLS / TECHNICAL SKILLS / CORE COMPETENCIES / AREAS OF EXPERTISE
       - CERTIFICATIONS / LICENSES / CREDENTIALS
       - PROJECTS / KEY PROJECTS / NOTABLE PROJECTS
       - ACHIEVEMENTS / ACCOMPLISHMENTS / AWARDS
       - VOLUNTEER EXPERIENCE / COMMUNITY INVOLVEMENT
       - ADDITIONAL INFORMATION / OTHER / MISCELLANEOUS
    
    3. Extract the COMPLETE content under each section until the next section begins
    4. Include ALL text, bullet points, formatting, and details for each section
    5. Don't worry about perfect categorization - capture everything
    
    For each section found:
    - Use the section title as the JSON key (clean and standardized)
    - Include ALL content under that section as the value
    - Preserve important formatting cues and details
    
    Return as JSON with section titles as keys and complete section content as values.
    If you can't identify clear sections, put everything under "Full Resume".
    Always return valid JSON with properly escaped strings.
    
    Resume Text:
    ${truncatedText}
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use faster model for parsing
      messages: [
        { role: 'system', content: 'You are an expert resume section extractor that can parse any resume format or style. Always return valid JSON with properly escaped strings.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 3000, // Optimize token usage
      response_format: { type: "json_object" }
    }, {
      timeout: 30000, // 30 seconds timeout for faster response
    });

    // Try to parse the result with better error handling
    try {
      const content = response.choices[0].message.content || '';
      
      // Validate that we have content
      if (!content.trim()) {
        console.warn("Empty response from OpenAI for resume segmentation");
        return { "Full Resume": text };
      }
      
      // Clean the content before parsing - ONLY remove markdown formatting
      let cleanContent = content.trim();
      
      // Remove any potential markdown formatting
      cleanContent = cleanContent.replace(/```json\n?|```\n?/g, '');
      
      // DON'T manually escape characters - OpenAI json_object format already returns valid JSON
      // The following lines were causing double-escaping issues:
      // cleanContent = cleanContent.replace(/\n/g, '\\n');
      // cleanContent = cleanContent.replace(/\r/g, '\\r');
      // cleanContent = cleanContent.replace(/\t/g, '\\t');
      
      // Attempt to parse the already-valid JSON
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
    You are an expert resume parser that can extract structured information from ANY resume format or style.
    
    Your task: Convert this resume into a comprehensive structured JSON format.
    
    IMPORTANT - Handle ALL resume types and formats:
    - Traditional chronological resumes
    - Modern functional resumes
    - Creative/designer resumes with unique layouts
    - Technical resumes with extensive project details
    - Academic resumes with research focus
    - Executive resumes with leadership emphasis
    - Career-change resumes with transferable skills
    - Entry-level resumes with limited experience
    - International resumes with varying formats
    
    EXTRACTION RULES:
    
    1. SUMMARY/OBJECTIVE:
       - Look for: Summary, Objective, Profile, Professional Summary, Career Objective, About Me
       - Extract the complete professional summary or objective statement
       - If multiple summary-like sections exist, combine them intelligently
    
    2. WORK EXPERIENCE:
       - Look for: Work Experience, Experience, Employment, Professional Experience, Career History, Employment History
       - Extract ALL jobs/positions with complete details
       - Include: Company name, job title, date range, and ALL accomplishments/responsibilities
       - Handle various date formats (2020-2023, Jan 2020 - Dec 2023, 2020-Present, etc.)
       - Capture bullet points, achievements, metrics, and responsibilities
    
    3. TECHNICAL SKILLS:
       - Look for: Skills, Technical Skills, Core Competencies, Areas of Expertise, Proficiencies, Technologies
       - Extract ONLY actual skills, tools, technologies, programming languages, software, and methodologies
       - EXCLUDE: Licenses, certifications, credentials, degrees
       - Include: Programming languages, frameworks, tools, software, methodologies, platforms
       - Examples: "Python", "React", "AWS", "Machine Learning", "Project Management", "SQL"
    
    4. EDUCATION:
       - Look for: Education, Academic Background, Qualifications, Academic Credentials
       - Extract degrees, institutions, graduation dates, relevant coursework
       - Handle various education formats and international degrees
    
    5. CERTIFICATIONS/LICENSES:
       - Look for: Certifications, Licenses, Credentials, Professional Development, Training
       - Include ALL certifications, licenses, professional credentials
       - Examples: "AWS Certified", "PMP", "Driver's License", "Professional Engineer License"
    
    6. PROJECTS:
       - Look for: Projects, Key Projects, Notable Projects, Portfolio, Personal Projects
       - Extract project names and descriptions
       - Include technologies used, outcomes, and impact
    
    CRITICAL PARSING INSTRUCTIONS:
    - Be comprehensive - don't miss any information
    - Handle inconsistent formatting gracefully
    - If information spans multiple sections, consolidate appropriately
    - Preserve all important details and metrics
    - Convert informal language to professional terminology
    - Handle resumes with non-standard section names
    - Extract information even from poorly formatted resumes
    
    Parse from these resume sections:
    ${JSON.stringify(sectionsData, null, 2)}
    
    Return this EXACT JSON structure:
    {
      "Summary": "Complete professional summary or objective...",
      
      "Work Experience": [
        {
          "company": "Company Name",
          "role": "Job Title", 
          "date_range": "Start Date - End Date",
          "accomplishments": ["Achievement 1", "Achievement 2", "Achievement 3", "..."]
        }
      ],
      
      "Technical Skills": ["Skill1", "Skill2", "Technology1", "Tool1", "..."],
      
      "Education": [
        {
          "institution": "University/School Name",
          "degree": "Degree Type and Major",
          "graduation_date": "Date or Year"
        }
      ],
      
      "Certifications": ["Certification 1", "License 1", "Credential 1", "..."],
      
      "Projects": ["Project 1 description", "Project 2 description", "..."]
    }
    
    IMPORTANT:
    - If any section is missing information, use empty string ("") or empty array ([])
    - Ensure ALL fields are present in the response
    - Extract maximum possible information from the available text
    - Handle edge cases gracefully
    - Return only the JSON object without explanations
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
      max_tokens: 3000, // Optimize token usage
      response_format: { type: "json_object" }
    }, {
      timeout: 30000, // 30 seconds timeout for faster response
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
      
      // Clean the content before parsing - ONLY remove markdown formatting
      let cleanContent = content.trim();
      
      // Remove any potential markdown formatting
      cleanContent = cleanContent.replace(/```json\n?|```\n?/g, '');
      
      // DON'T manually escape characters - OpenAI json_object format already returns valid JSON
      // The following lines were causing double-escaping issues:
      // cleanContent = cleanContent.replace(/\n/g, '\\n');
      // cleanContent = cleanContent.replace(/\r/g, '\\r');
      // cleanContent = cleanContent.replace(/\t/g, '\\t');
      
      // Attempt to parse the already-valid JSON
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
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parse error';
      console.error("Failed to parse structured resume:", {
        error: errorMessage,
        content: response.choices[0].message.content?.substring(0, 500) + '...'
      });
      
      // Don't return empty data - throw the actual error
      throw new Error(`Failed to parse resume structure: ${errorMessage}. Please try again.`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error("Resume structuring error:", error);
    
    // Don't return empty data - throw the actual error
    throw new Error(`Resume processing failed: ${errorMessage}`);
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
      max_tokens: 2000, // Optimize token usage
      response_format: { type: "json_object" }
    }, {
      timeout: 30000, // 30 seconds timeout for faster response
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