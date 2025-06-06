import OpenAI from 'openai';
import { extract_job_requirements, extract_key_job_terms } from './jobParser';
import { extract_skills_from_text, segment_resume_sections, structure_resume } from './resumeParser';

export interface ResumeScore {
  matched_skills: string[];
  missing_skills: string[];
  recommendations: string[];
  match_percentage: number;
  match_score: number;
  openai_explanation?: string;
  category_scores?: {
    skills_match: number;
    experience_relevance: number;
    education_certifications: number;
    additional_factors: number;
  };
  alternative_positions?: string[];
}

// Constants for text optimization
const MAX_RESUME_CHARS = 3500;
const MAX_JOB_DESCRIPTION_CHARS = 2000;
const MAX_SUMMARY_CHARS = 800;
const MAX_EXPERIENCE_CHARS = 1500;
const MAX_SKILLS_CHARS = 1000;

/**
 * Preprocesses and cleans text to remove noise and optimize for OpenAI processing
 */
function preprocessText(text: string, maxLength: number): string {
  if (!text) return '';
  
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove multiple consecutive newlines
    .replace(/\n{3,}/g, '\n\n')
    // Remove special characters that add noise
    .replace(/[^\w\s\-.,;:()\n\[\]]/g, ' ')
    // Remove email addresses (privacy + noise reduction)
    .replace(/\S+@\S+\.\S+/g, '[EMAIL]')
    // Remove phone numbers (privacy + noise reduction)
    .replace(/(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g, '[PHONE]')
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/g, '[URL]')
    // Trim and limit length
    .trim()
    .substring(0, maxLength);
}

/**
 * Extracts and optimizes the most relevant parts of resume text
 */
function optimizeResumeText(resumeText: string): string {
  if (!resumeText) return '';
  
  // First, preprocess the entire text
  const cleaned = preprocessText(resumeText, MAX_RESUME_CHARS * 2);
  
  // Extract key sections with priority
  const sections = [];
  const lowerText = cleaned.toLowerCase();
  
  // Extract summary/objective (high priority)
  const summaryMatch = lowerText.match(/(summary|objective|profile)([^]*?)(?=\n\s*[a-z\s]+:|\n\s*education|\n\s*experience|\n\s*skills|$)/i);
  if (summaryMatch) {
    sections.push(summaryMatch[0].substring(0, MAX_SUMMARY_CHARS));
  }
  
  // Extract skills (high priority)
  const skillsMatch = lowerText.match(/(skills|technical skills|core competencies)([^]*?)(?=\n\s*[a-z\s]+:|\n\s*education|\n\s*experience|$)/i);
  if (skillsMatch) {
    sections.push(skillsMatch[0].substring(0, MAX_SKILLS_CHARS));
  }
  
  // Extract work experience (medium priority)
  const experienceMatch = lowerText.match(/(experience|work experience|employment)([^]*?)(?=\n\s*[a-z\s]+:|\n\s*education|$)/i);
  if (experienceMatch) {
    sections.push(experienceMatch[0].substring(0, MAX_EXPERIENCE_CHARS));
  }
  
  // If sections are too short, include more of the original text
  const combinedSections = sections.join('\n\n');
  if (combinedSections.length < MAX_RESUME_CHARS * 0.3) {
    return cleaned.substring(0, MAX_RESUME_CHARS);
  }
  
  return combinedSections.substring(0, MAX_RESUME_CHARS);
}

/**
 * Optimizes job description text for faster processing
 */
function optimizeJobDescription(jobDescription: string): string {
  if (!jobDescription) return '';
  
  const cleaned = preprocessText(jobDescription, MAX_JOB_DESCRIPTION_CHARS * 1.5);
  
  // Extract key sections with priority
  const sections = [];
  const lowerText = cleaned.toLowerCase();
  
  // Extract requirements (highest priority)
  const requirementsMatch = lowerText.match(/(requirements?|qualifications?|skills?)([^]*?)(?=\n\s*[a-z\s]+:|\n\s*responsibilities|\n\s*duties|$)/i);
  if (requirementsMatch) {
    sections.push(requirementsMatch[0]);
  }
  
  // Extract responsibilities (medium priority)
  const responsibilitiesMatch = lowerText.match(/(responsibilities?|duties|role)([^]*?)(?=\n\s*[a-z\s]+:|\n\s*requirements|$)/i);
  if (responsibilitiesMatch) {
    sections.push(responsibilitiesMatch[0]);
  }
  
  // If sections are too short, include more of the original text
  const combinedSections = sections.join('\n\n');
  if (combinedSections.length < MAX_JOB_DESCRIPTION_CHARS * 0.4) {
    return cleaned.substring(0, MAX_JOB_DESCRIPTION_CHARS);
  }
  
  return combinedSections.substring(0, MAX_JOB_DESCRIPTION_CHARS);
}

const openaiApiKey = process.env.OPENAI_API_KEY;
let openai: OpenAI | null = null;
if (openaiApiKey) {
  openai = new OpenAI({ apiKey: openaiApiKey });
}

export async function scoreResume(resumeText: string, jobDescription: string): Promise<ResumeScore> {
  // Early validation
  if (jobDescription.trim().length < 20) {
    return {
      matched_skills: [],
      missing_skills: [],
      recommendations: ["The job description is too short. Please provide a more detailed job description."],
      match_percentage: 0,
      match_score: 0
    };
  }

  if (!openai) {
    return {
      matched_skills: [],
      missing_skills: [],
      recommendations: ["OpenAI API not available. Cannot analyze resume at this time."],
      match_percentage: 0,
      match_score: 0
    };
  }

  try {
    // OPTIMIZATION: Preprocess and truncate texts early
    const optimizedResumeText = optimizeResumeText(resumeText);
    const optimizedJobDescription = optimizeJobDescription(jobDescription);
    
    // Early fallback for very large texts that couldn't be optimized effectively
    if (optimizedResumeText.length < 100) {
      return {
        matched_skills: [],
        missing_skills: [],
        recommendations: ["Resume text too short or couldn't be processed. Please try a different format."],
        match_percentage: 0,
        match_score: 0
      };
    }

    // Extract structured resume information using the optimized text
    const structuredResume = await structure_resume(optimizedResumeText);
    const segments = await segment_resume_sections(optimizedResumeText);
    
    // Prepare the resume data with optimization
    const candidate_skills: string[] = [];
    const candidate_experience: string[] = [];
    const candidate_roles: string[] = [];
    
    // Extract skills information from the structured resume (optimized)
    let skills_info = "";
    if (structuredResume["Technical Skills"].length > 0) {
      const skillsText = structuredResume["Technical Skills"].join(", ");
      skills_info = preprocessText(skillsText, MAX_SKILLS_CHARS);
      
      structuredResume["Technical Skills"].slice(0, 20).forEach(skill => { // Limit to top 20 skills
        if (skill.trim().length > 2) {
          candidate_skills.push(skill.trim());
        }
      });
    } else {
      // Fallback with optimization
      for (const key of ["Skills", "Technical Skills", "Areas of Expertise"]) {
        const segment = segments[key] || "";
        if (typeof segment === 'string' && segment.length > 0) {
          const optimizedSegment = preprocessText(segment, 400);
          skills_info += optimizedSegment + " ";
          
          // Extract individual skills (limited)
          const skillLines = optimizedSegment.split(/[,\n]/).slice(0, 15);
          for (const line of skillLines) {
            if (line.trim() && line.trim().length > 2) {
              candidate_skills.push(line.trim());
            }
          }
        }
      }
      skills_info = skills_info.substring(0, MAX_SKILLS_CHARS);
    }
    
    // Extract experience information (optimized)
    let experience_info = "";
    if (structuredResume["Work Experience"].length > 0) {
      // Limit to most recent 3 jobs
      const recentJobs = structuredResume["Work Experience"].slice(0, 3);
      recentJobs.forEach(job => {
        experience_info += `${job.role} at ${job.company}\n`;
        // Limit accomplishments to top 3
        job.accomplishments.slice(0, 3).forEach(accomplishment => {
          experience_info += `- ${accomplishment.substring(0, 150)}\n`;
        });
        
        candidate_roles.push(job.role);
        candidate_experience.push(...job.accomplishments.slice(0, 2));
      });
    } else {
      // Fallback with optimization
      for (const key of ["Professional Experience", "Experience", "Work Experience"]) {
        const segment = segments[key] || "";
        if (typeof segment === 'string' && segment.length > 0) {
          const optimizedSegment = preprocessText(segment, 600);
          experience_info += optimizedSegment + "\n";
          
          // Extract roles efficiently
          const roleMatches = optimizedSegment.match(/\b(manager|director|specialist|engineer|developer|analyst|coordinator|designer|consultant|lead)\b/gi);
          if (roleMatches) {
            candidate_roles.push(...roleMatches.slice(0, 3));
          }
        }
      }
      experience_info = experience_info.substring(0, MAX_EXPERIENCE_CHARS);
    }
    
    // Extract summary (optimized)
    let summary = preprocessText(structuredResume.Summary || "", MAX_SUMMARY_CHARS);
    if (!summary) {
      for (const key of ["Summary", "Professional Summary", "Profile"]) {
        const segment = segments[key] || "";
        if (typeof segment === 'string' && segment.length > 0) {
          summary = preprocessText(segment, MAX_SUMMARY_CHARS);
          break;
        }
      }
    }
    
    // Use optimized functions with reduced token usage
    const resumeSkills = await extract_skills_from_text(optimizedResumeText);
    const jobRequirements = await extract_job_requirements(optimizedJobDescription);
    const jobTerms = await extract_key_job_terms(optimizedJobDescription);
    
         // Limit extracted data to prevent token overflow
     const limitedResumeSkills = resumeSkills.slice(0, 25);
     const limitedRequiredSkills = jobRequirements.required_skills.slice(0, 15);
     const limitedPreferredSkills = jobRequirements.preferred_skills.slice(0, 10);
     const limitedKeywords = jobTerms.keywords.slice(0, 15);
     
     // OPTIMIZED PROMPT: Shorter and more focused
     const prompt = `
Evaluate resume vs job match. Score 0-100 across these criteria:

SCORING:
- Skills Match (40%): Technical + soft skills alignment
- Experience (30%): Relevant experience + achievements  
- Education (10%): Required qualifications
- Keywords (20%): ATS terms + industry buzzwords

RESUME SUMMARY: ${summary.substring(0, 400)}

RESUME SKILLS: ${skills_info.substring(0, 500)}

KEY SKILLS: ${limitedResumeSkills.join(", ").substring(0, 600)}

RECENT EXPERIENCE: ${experience_info.substring(0, 800)}

REQUIRED SKILLS: ${limitedRequiredSkills.join(", ")}
PREFERRED SKILLS: ${limitedPreferredSkills.join(", ")}
JOB KEYWORDS: ${limitedKeywords.join(", ")}
EXPERIENCE LEVEL: ${jobRequirements.experience_level}

Return JSON with:
- "match_score": 0-100 percentage
- "matched_skills": skills found in both (max 15)
- "missing_skills": skills missing from resume (max 10)  
- "recommendations": 3 specific improvements
- "alternative_positions": 2 job titles if score < 40
`;

    // OPTIMIZED OpenAI call: Faster model, lower timeout, limited tokens
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Faster than gpt-4o-mini
      messages: [
        {
          role: 'system',
          content: 'You are a resume scorer. Provide accurate, concise analysis in JSON format. Be specific but brief.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1, // Lower for faster processing
      max_tokens: 2000, // Reduced from 10000
      response_format: { type: "json_object" }
    }, {
      timeout: 40000, // Reduced to 40 seconds
    });
    
    try {
      const content = response.choices[0].message.content || '';
      const score_data = JSON.parse(content);
      
      // Validate with optimized defaults
      const validated_data: ResumeScore = {
        matched_skills: (score_data.matched_skills || []).slice(0, 15),
        missing_skills: (score_data.missing_skills || []).slice(0, 10), 
        recommendations: (score_data.recommendations || ["Enhance resume with relevant skills"]).slice(0, 3),
        match_percentage: Math.min(100, Math.max(0, score_data.match_score || 25)),
        match_score: Math.min(100, Math.max(0, score_data.match_score || 25)),
        category_scores: score_data.category_scores || {
          skills_match: 15,
          experience_relevance: 12,
          education_certifications: 5,
          additional_factors: 8
        },
        alternative_positions: undefined
      };
      
      // Simplified alternative positions logic
      if (validated_data.match_percentage < 40) {
        let alternative_positions = score_data.alternative_positions || [];
        
        if (!alternative_positions || alternative_positions.length === 0) {
          // Quick fallback based on key skills
          const skillsLower = limitedResumeSkills.join(" ").toLowerCase();
          
          if (skillsLower.includes("software") || skillsLower.includes("developer")) {
            alternative_positions = ["Software Developer", "Technical Specialist"];
          } else if (skillsLower.includes("design")) {
            alternative_positions = ["Designer", "Creative Specialist"];
          } else if (skillsLower.includes("manage")) {
            alternative_positions = ["Project Manager", "Team Lead"];
          } else if (skillsLower.includes("market")) {
            alternative_positions = ["Marketing Specialist", "Digital Marketing"];
          } else {
            alternative_positions = ["Professional role in your field", "Specialist position"];
          }
        }
        
        validated_data.alternative_positions = alternative_positions.slice(0, 2);
      }
      
      return validated_data;
      
    } catch (parseError) {
      console.error("Failed to parse OpenAI scoring response:", parseError);
      return {
        matched_skills: [],
        missing_skills: [],
        recommendations: ["Error analyzing resume. Please try again."],
        match_percentage: 0,
        match_score: 0
      };
    }
  } catch (error) {
    console.error("OpenAI scoring error:", error);
    return {
      matched_skills: [],
      missing_skills: [],
      recommendations: ["Error analyzing resume. Please try again."],
      match_percentage: 0,
      match_score: 0
    };
  }
} 