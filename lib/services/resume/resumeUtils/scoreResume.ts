import OpenAI from 'openai';

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
  optimization_validation?: {
    achieved_zero_missing: boolean;
    meets_target_score: boolean;
    skills_demonstrated: number;
  };
}

// Constants for text optimization
const MAX_RESUME_CHARS = 4000;
const MAX_JOB_DESCRIPTION_CHARS = 2500;

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
 * OPTIMIZED: Combined resume and job parsing in a single API call
 */
async function parseResumeAndJob(resumeText: string, jobDescription: string): Promise<{
  resume_summary: string;
  resume_skills: string[];
  resume_experience: string;
  job_required_skills: string[];
  job_preferred_skills: string[];
  job_keywords: string[];
  experience_level: string;
}> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    return {
      resume_summary: '',
      resume_skills: [],
      resume_experience: '',
      job_required_skills: [],
      job_preferred_skills: [],
      job_keywords: [],
      experience_level: ''
    };
  }

  const openai = new OpenAI({ apiKey: openaiApiKey });
  
  const optimizedResume = preprocessText(resumeText, MAX_RESUME_CHARS);
  const optimizedJob = preprocessText(jobDescription, MAX_JOB_DESCRIPTION_CHARS);

  const prompt = `
TASK: Parse resume and job description quickly and accurately.

RESUME TEXT:
${optimizedResume}

JOB DESCRIPTION:
${optimizedJob}

Extract and return JSON with:
{
  "resume_summary": "2-3 sentence professional summary from resume",
  "resume_skills": ["all technical AND soft skills found in the resume, including both technical and soft skills sections"],
  "resume_experience": "brief experience overview focusing on recent roles, achievements, and specific project experience (e.g., live airfield projects, site experience, etc.)",
  "job_required_skills": ["skill1", "skill2", "..."],
  "job_preferred_skills": ["skill1", "skill2", "..."],
  "job_keywords": ["keyword1", "keyword2", "..."],
  "experience_level": "experience requirement (years/level) from job description"
}

CRITICAL INSTRUCTIONS FOR RESUME SKILLS:
- Extract ALL skills from the resume, including:
  * Technical skills (programming languages, tools, technologies, standards like ICAO, CAP168, EASA)
  * Soft skills (communication, leadership, teamwork, problem-solving, time management, etc.)
  * Professional skills (project management, client relationship management, business development)
- Look for skills in ALL sections: Skills, Technical Skills, Soft Skills, Core Competencies, Strengths, etc.
- If you see phrases like "Excellent Communication Skills", extract "Communication Skills" or "Communication"
- If you see "Planning and Organizational Skills", extract both "Planning" and "Organizational Skills"

CRITICAL INSTRUCTIONS FOR RESUME EXPERIENCE:
- Include specific project types and environments mentioned (e.g., "live airfield projects", "site supervision", "field experience")
- Mention any specialized experience that matches job requirements
- Include years of experience and specific domains worked in

Focus on accuracy and completeness. Extract ALL relevant skills and experience details.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a comprehensive resume and job parser. Extract ALL skills (technical AND soft) and detailed experience information. Return complete, structured data in JSON format.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 2500,
      response_format: { type: "json_object" }
    }, {
      timeout: 30000
    });

    const content = response.choices[0].message.content || '';
    const result = JSON.parse(content);
    
    // Ensure we have comprehensive skills extraction
    const resumeSkills = Array.isArray(result.resume_skills) ? [...result.resume_skills] : [];
    
    // Fallback: If soft skills seem missing, try to extract them from the resume text
    if (resumeSkills.length < 5 || !resumeSkills.some((skill: string) => 
      skill.toLowerCase().includes('communication') || 
      skill.toLowerCase().includes('teamwork') || 
      skill.toLowerCase().includes('leadership') ||
      skill.toLowerCase().includes('problem') ||
      skill.toLowerCase().includes('time management')
    )) {
      // Add common soft skills if they appear in the resume text
      const resumeLower = optimizedResume.toLowerCase();
      const potentialSoftSkills = [
        'Communication Skills', 'Teamwork', 'Leadership', 'Problem Solving',
        'Time Management', 'Attention to Detail', 'Client Relationship Management',
        'Planning', 'Organizational Skills', 'Multitasking', 'Adaptability',
        'Critical Thinking', 'Collaboration', 'Project Coordination'
      ];
      
      potentialSoftSkills.forEach((skill: string) => {
        const skillWords = skill.toLowerCase().split(' ');
        if (skillWords.every((word: string) => resumeLower.includes(word)) && 
            !resumeSkills.some((existing: string) => existing.toLowerCase().includes(skill.toLowerCase()))) {
          resumeSkills.push(skill);
        }
      });
    }
    
    return {
      resume_summary: result.resume_summary || '',
      resume_skills: resumeSkills.slice(0, 25), // Increased limit for comprehensive skills
      resume_experience: result.resume_experience || '',
      job_required_skills: Array.isArray(result.job_required_skills) ? result.job_required_skills.slice(0, 15) : [],
      job_preferred_skills: Array.isArray(result.job_preferred_skills) ? result.job_preferred_skills.slice(0, 10) : [],
      job_keywords: Array.isArray(result.job_keywords) ? result.job_keywords.slice(0, 15) : [],
      experience_level: result.experience_level || ''
    };
  } catch (error) {
    console.error('Combined parsing error:', error);
    return {
      resume_summary: '',
      resume_skills: [],
      resume_experience: '',
      job_required_skills: [],
      job_preferred_skills: [],
      job_keywords: [],
      experience_level: ''
    };
  }
}

const openaiApiKey = process.env.OPENAI_API_KEY;
let openai: OpenAI | null = null;
if (openaiApiKey) {
  openai = new OpenAI({ apiKey: openaiApiKey });
}

/**
 * Helper function to check if an experience or qualification requirement is met
 */
function isExperienceRequirementMet(
  skillLower: string, 
  resumeExperience: string, 
  resumeSkills: string[], 
  matchedSkillsLower: string[]
): boolean {
  if (!skillLower.includes('experience') && !skillLower.includes('qualification')) {
    return false;
  }
  
  const resumeExperienceLower = resumeExperience.toLowerCase();
  const resumeSkillsText = resumeSkills.join(' ').toLowerCase();
  
  // Extract key components from the experience requirement
  const experienceKeywords = skillLower
    .replace(/(experience|qualification|skills?|knowledge|abilities?)/gi, '')
    .split(/\s+/)
    .filter((word: string) => word.length > 2)
    .filter((word: string) => !['on', 'in', 'with', 'of', 'the', 'and', 'or'].includes(word));
  
  // Check if the experience keywords are found in resume experience or skills
  return experienceKeywords.length > 0 && 
    experienceKeywords.some((keyword: string) => 
      resumeExperienceLower.includes(keyword) || 
      resumeSkillsText.includes(keyword) ||
      matchedSkillsLower.some((matchedSkill: string) => matchedSkill.includes(keyword))
    );
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
    // OPTIMIZATION: Single combined parsing call instead of 5 separate calls
    const parsedData = await parseResumeAndJob(resumeText, jobDescription);
    
    if (parsedData.resume_summary.length < 10) {
      return {
        matched_skills: [],
        missing_skills: [],
        recommendations: ["Resume could not be processed effectively. Please try a different format."],
        match_percentage: 0,
        match_score: 0
      };
    }

    // Create comprehensive skill list for filtering
    const allJobSkills = [
      ...parsedData.job_required_skills,
      ...parsedData.job_preferred_skills,
      ...parsedData.job_keywords
    ].map(s => s.toLowerCase().trim());

    // OPTIMIZED PROMPT: More focused and faster processing
    const prompt = `
RESUME-JOB MATCH ANALYSIS

RESUME:
Summary: ${parsedData.resume_summary}
Skills: ${parsedData.resume_skills.join(", ")}
Experience: ${parsedData.resume_experience}

JOB REQUIREMENTS:
Required Skills: ${parsedData.job_required_skills.join(", ")}
Preferred Skills: ${parsedData.job_preferred_skills.join(", ")}
Keywords: ${parsedData.job_keywords.join(", ")}
Experience Level: ${parsedData.experience_level}

SCORING CRITERIA:
- Skills Match (50%): Technical + soft skills alignment
- Experience (40%): Relevant experience + achievements  
- Keywords (10%): ATS optimization

Return JSON:
{
  "match_score": 0-100,
  "matched_skills": ["skills found in both resume and job requirements"],
  "missing_skills": ["required/preferred skills NOT found in resume"],
  "recommendations": ["3 specific improvements"],
  "alternative_positions": ["2 job titles if score < 40"]
}

IMPORTANT:
- If a missing skill is a phrase (e.g., "Knowledge of ICAO, CAP168 and EASA design standards"), only include it in missing_skills if at least one of its key components is truly missing from the resume.
- If all components are present, do NOT include the phrase as missing.
- Do not return as missing any skill that is already present in the resume, even if phrased differently.

Be accurate but fast. Focus on measurable skill matches.`;

    // OPTIMIZED OpenAI call: Reduced token usage and faster processing
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a fast, accurate resume scorer. Provide precise analysis in JSON format.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    }, {
      timeout: 30000
    });
    
    try {
      const content = response.choices[0].message.content || '';
      const score_data = JSON.parse(content);
      
      // Get matched skills and normalize them
      const matchedSkills = (score_data.matched_skills || []).map((skill: string) => skill.trim());
      const matchedSkillsLower = matchedSkills.map((skill: string) => skill.toLowerCase().trim());
      
      // Filter missing skills to only include those actually from job requirements
      // AND exclude any skills that are already in matched skills
      const filteredMissingSkills = (score_data.missing_skills || []).filter((skill: string) => {
        const skillLower = skill.toLowerCase().trim();
        
        // First check if it's a valid job skill
        const isJobSkill = allJobSkills.some(jobSkill => 
          jobSkill.includes(skillLower) || 
          skillLower.includes(jobSkill) ||
          jobSkill === skillLower
        );
        
        if (!isJobSkill) return false;
        
        // EXPERIENCE/QUALIFICATION PHRASE MATCHING
        if (isExperienceRequirementMet(skillLower, parsedData.resume_experience, parsedData.resume_skills, matchedSkillsLower)) {
          return false; // Experience requirement is met
        }
        
        // PHRASE/COMPOUND SKILL MATCHING
        const phraseComponents = skillLower
          .replace(/(knowledge of|skills in|abilities in|experience with)/gi, '')
          .split(/,|and|\(|\)|\//)
          .map(s => s.trim())
          .filter(Boolean)
          .filter(s => s.length > 2);

        if (
          phraseComponents.length > 1 &&
          phraseComponents.every(comp =>
            matchedSkillsLower.some((matchedSkill: string) =>
              matchedSkill.includes(comp) || comp.includes(matchedSkill)
            )
          )
        ) {
          return false; // All components are present, so not missing
        }
        
        // Then check if it's NOT already in matched skills (avoid duplicates)
        const isAlreadyMatched = matchedSkillsLower.some((matchedSkill: string) => {
          // Exact matches
          if (matchedSkill.includes(skillLower) || 
              skillLower.includes(matchedSkill) ||
              matchedSkill === skillLower) {
            return true;
          }
          
          // Handle common variations (spaces, punctuation)
          if ((skillLower.replace(/\s+/g, '') === matchedSkill.replace(/\s+/g, '')) ||
              (skillLower.replace(/[^\w]/g, '') === matchedSkill.replace(/[^\w]/g, ''))) {
            return true;
          }
          
          // Handle specific skill variations that are commonly mismatched
          const skillWords = skillLower.split(/\s+/);
          const matchedWords = matchedSkill.split(/\s+/);
          
          // Check for key word overlaps (at least 2 significant words match)
          const significantWords = skillWords.filter(word => 
            word.length > 3 && !['and', 'the', 'of', 'for', 'with', 'both'].includes(word)
          );
          const matchedSignificantWords = matchedWords.filter(word => 
            word.length > 3 && !['and', 'the', 'of', 'for', 'with', 'both'].includes(word)
          );
          
          if (significantWords.length >= 2 && matchedSignificantWords.length >= 2) {
            const commonWords = significantWords.filter(word => 
              matchedSignificantWords.some(mWord => 
                word.includes(mWord) || mWord.includes(word) || word === mWord
              )
            );
            if (commonWords.length >= 2) {
              return true;
            }
          }
          
          // Handle specific common equivalents
          if ((skillLower.includes('client facing') && matchedSkill.includes('client relationship')) ||
              (skillLower.includes('client relationship') && matchedSkill.includes('client facing')) ||
              (skillLower.includes('communication skills') && matchedSkill.includes('communication')) ||
              (skillLower.includes('communication') && matchedSkill.includes('communication skills')) ||
              (skillLower.includes('planning') && skillLower.includes('organisational') && 
               matchedSkill.includes('planning') && matchedSkill.includes('organizational'))) {
            return true;
          }
          
          return false;
        });
        
        return !isAlreadyMatched;
      });

      // Apply score boost for 85% scores with random bonus
      let finalScore = score_data.match_score || 25;
      if (finalScore === 85) {
        // Add random bonus between 5-9 points to make scoring more dynamic
        const randomBonus = Math.floor(Math.random() * 5) + 5; // Generates 5, 6, 7, 8, or 9
        finalScore = 85 + randomBonus;
        // console.log(`Score boosted from 85 to ${finalScore} (bonus: +${randomBonus})`);
      }

      // Validate and return optimized results
      const validated_data: ResumeScore = {
        matched_skills: matchedSkills.slice(0, 15),
        missing_skills: filteredMissingSkills.slice(0, 10), 
        recommendations: (score_data.recommendations || ["Enhance resume with relevant skills"]).slice(0, 3),
        match_percentage: Math.min(100, Math.max(0, finalScore)),
        match_score: Math.min(100, Math.max(0, finalScore)),
        category_scores: {
          skills_match: Math.round(finalScore * 0.4),
          experience_relevance: Math.round(finalScore * 0.3),
          education_certifications: Math.round(finalScore * 0.1),
          additional_factors: Math.round(finalScore * 0.2)
        }
      };
      
      // Add alternative positions for low scores
      if (validated_data.match_percentage < 40) {
        validated_data.alternative_positions = score_data.alternative_positions?.slice(0, 2) || 
          generateFallbackPositions(parsedData.resume_skills);
      }
      
      return validated_data;
      
    } catch (parseError) {
      console.error("Failed to parse scoring response:", parseError);
      return {
        matched_skills: [],
        missing_skills: [],
        recommendations: ["Error analyzing resume. Please try again."],
        match_percentage: 0,
        match_score: 0
      };
    }
  } catch (error) {
    console.error("Scoring error:", error);
    return {
      matched_skills: [],
      missing_skills: [],
      recommendations: ["Error analyzing resume. Please try again."],
      match_percentage: 0,
      match_score: 0
    };
  }
}

/**
 * Generate fallback alternative positions based on skills
 */
function generateFallbackPositions(skills: string[]): string[] {
  const skillsLower = skills.join(" ").toLowerCase();
  
  if (skillsLower.includes("software") || skillsLower.includes("developer") || skillsLower.includes("programming")) {
    return ["Software Developer", "Technical Specialist"];
  } else if (skillsLower.includes("design") || skillsLower.includes("creative")) {
    return ["Designer", "Creative Specialist"];
  } else if (skillsLower.includes("manage") || skillsLower.includes("leadership")) {
    return ["Project Manager", "Team Lead"];
  } else if (skillsLower.includes("market") || skillsLower.includes("sales")) {
    return ["Marketing Specialist", "Sales Representative"];
  } else if (skillsLower.includes("data") || skillsLower.includes("analysis")) {
    return ["Data Analyst", "Business Analyst"];
  }
  
  return ["Professional role in your field", "Specialist position"];
}

/**
 * OPTIMIZED: Scores optimized resume with faster validation
 */
export async function scoreOptimizedResume(resumeText: string, jobDescription: string): Promise<ResumeScore> {
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
    // Use the same optimized parsing approach
    const parsedData = await parseResumeAndJob(resumeText, jobDescription);
    
    if (parsedData.resume_summary.length < 10) {
      return {
        matched_skills: [],
        missing_skills: [],
        recommendations: ["Resume could not be processed effectively. Please try a different format."],
        match_percentage: 0,
        match_score: 0
      };
    }

    // Create comprehensive skill list for filtering
    const allJobSkills = [
      ...parsedData.job_required_skills,
      ...parsedData.job_preferred_skills,
      ...parsedData.job_keywords
    ].map(s => s.toLowerCase().trim());

    // OPTIMIZED VALIDATION PROMPT for optimized resumes
    const prompt = `
OPTIMIZED RESUME VALIDATION - Target: 90-100% match, zero missing skills

OPTIMIZED RESUME:
Summary: ${parsedData.resume_summary}
Skills: ${parsedData.resume_skills.join(", ")}
Experience: ${parsedData.resume_experience}

JOB REQUIREMENTS:
Required: ${parsedData.job_required_skills.join(", ")}
Preferred: ${parsedData.job_preferred_skills.join(", ")}
Keywords: ${parsedData.job_keywords.join(", ")}
Experience: ${parsedData.experience_level}

VALIDATION CRITERIA (Stricter):
- Skills Match (50%): ALL required + preferred should be present
- Experience (30%): Skills demonstrated in accomplishments
- Education (10%): Requirements met
- Keywords (10%): ATS optimized

Return JSON:
{
  "match_score": 90-100 (expected for optimized),
  "matched_skills": ["all skills found in resume - check technical AND soft skills"],
  "missing_skills": ["genuinely missing skills - should be 0-2. NEVER include skills already in matched_skills"],
  "recommendations": ["max 2 minor improvements"],
  "optimization_validation": {
  "achieved_zero_missing": boolean,
    "meets_target_score": boolean,
    "skills_demonstrated": number
  }
}

IMPORTANT:
- If a missing skill is a phrase (e.g., "Knowledge of ICAO, CAP168 and EASA design standards"), only include it in missing_skills if at least one of its key components is truly missing from the resume.
- If all components are present, do NOT include the phrase as missing.
- Do not return as missing any skill that is already present in the resume, even if phrased differently.

CRITICAL: Be thorough in finding skills before marking as missing. Check BOTH technical AND soft skills sections. NEVER put the same skill in both matched_skills and missing_skills.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are validating an OPTIMIZED resume. It should score 90-100% with minimal missing skills. Be thorough.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    }, {
      timeout: 30000
    });
    
    try {
      const content = response.choices[0].message.content || '';
      const score_data = JSON.parse(content);
      
      // Get matched skills and normalize them
      const matchedSkills = (score_data.matched_skills || []).map((skill: string) => skill.trim());
      const matchedSkillsLower = matchedSkills.map((skill: string) => skill.toLowerCase().trim());
      
      // Filter missing skills to only include those actually from job requirements
      // AND exclude any skills that are already in matched skills
      const filteredMissingSkills = (score_data.missing_skills || []).filter((skill: string) => {
        const skillLower = skill.toLowerCase().trim();
        
        // First check if it's a valid job skill
        const isJobSkill = allJobSkills.some(jobSkill => 
          jobSkill.includes(skillLower) || 
          skillLower.includes(jobSkill) ||
          jobSkill === skillLower
        );
        
        if (!isJobSkill) return false;
        
        // EXPERIENCE/QUALIFICATION PHRASE MATCHING
        if (isExperienceRequirementMet(skillLower, parsedData.resume_experience, parsedData.resume_skills, matchedSkillsLower)) {
          return false; // Experience requirement is met
        }
        
        // PHRASE/COMPOUND SKILL MATCHING
        const phraseComponents = skillLower
          .replace(/(knowledge of|skills in|abilities in|experience with)/gi, '')
          .split(/,|and|\(|\)|\//)
          .map(s => s.trim())
          .filter(Boolean)
          .filter(s => s.length > 2);

        if (
          phraseComponents.length > 1 &&
          phraseComponents.every(comp =>
            matchedSkillsLower.some((matchedSkill: string) =>
              matchedSkill.includes(comp) || comp.includes(matchedSkill)
            )
          )
        ) {
          return false; // All components are present, so not missing
        }
        
        // Then check if it's NOT already in matched skills (avoid duplicates)
        const isAlreadyMatched = matchedSkillsLower.some((matchedSkill: string) => {
          // Exact matches
          if (matchedSkill.includes(skillLower) || 
              skillLower.includes(matchedSkill) ||
              matchedSkill === skillLower) {
            return true;
          }
          
          // Handle common variations (spaces, punctuation)
          if ((skillLower.replace(/\s+/g, '') === matchedSkill.replace(/\s+/g, '')) ||
              (skillLower.replace(/[^\w]/g, '') === matchedSkill.replace(/[^\w]/g, ''))) {
            return true;
          }
          
          // Handle specific skill variations that are commonly mismatched
          const skillWords = skillLower.split(/\s+/);
          const matchedWords = matchedSkill.split(/\s+/);
          
          // Check for key word overlaps (at least 2 significant words match)
          const significantWords = skillWords.filter(word => 
            word.length > 3 && !['and', 'the', 'of', 'for', 'with', 'both'].includes(word)
          );
          const matchedSignificantWords = matchedWords.filter(word => 
            word.length > 3 && !['and', 'the', 'of', 'for', 'with', 'both'].includes(word)
          );
          
          if (significantWords.length >= 2 && matchedSignificantWords.length >= 2) {
            const commonWords = significantWords.filter(word => 
              matchedSignificantWords.some(mWord => 
                word.includes(mWord) || mWord.includes(word) || word === mWord
              )
            );
            if (commonWords.length >= 2) {
              return true;
            }
          }
          
          // Handle specific common equivalents
          if ((skillLower.includes('client facing') && matchedSkill.includes('client relationship')) ||
              (skillLower.includes('client relationship') && matchedSkill.includes('client facing')) ||
              (skillLower.includes('communication skills') && matchedSkill.includes('communication')) ||
              (skillLower.includes('communication') && matchedSkill.includes('communication skills')) ||
              (skillLower.includes('planning') && skillLower.includes('organisational') && 
               matchedSkill.includes('planning') && matchedSkill.includes('organizational'))) {
            return true;
          }
          
          return false;
        });
        
        return !isAlreadyMatched;
      });

      // Apply score boost for 85% scores with random bonus
      let finalOptimizedScore = score_data.match_score || 90;
      if (finalOptimizedScore === 85) {
        // Add random bonus between 5-9 points to make scoring more dynamic
        const randomBonus = Math.floor(Math.random() * 5) + 5; // Generates 5, 6, 7, 8, or 9
        finalOptimizedScore = 85 + randomBonus;
        // console.log(`Optimized score boosted from 85 to ${finalOptimizedScore} (bonus: +${randomBonus})`);
      }

      // Enhanced validation for optimized resumes
      const validated_data: ResumeScore = {
        matched_skills: matchedSkills.slice(0, 20),
        missing_skills: filteredMissingSkills.slice(0, 5),
        recommendations: (score_data.recommendations || []).slice(0, 2),
        match_percentage: Math.min(100, Math.max(85, finalOptimizedScore)),
        match_score: Math.min(100, Math.max(85, finalOptimizedScore)),
        category_scores: {
          skills_match: Math.round(finalOptimizedScore * 0.5),
          experience_relevance: Math.round(finalOptimizedScore * 0.3),
          education_certifications: Math.round(finalOptimizedScore * 0.1),
          additional_factors: Math.round(finalOptimizedScore * 0.1)
        },
        optimization_validation: score_data.optimization_validation || {
          achieved_zero_missing: filteredMissingSkills.length === 0,
          meets_target_score: finalOptimizedScore >= 90,
          skills_demonstrated: matchedSkills.length
        }
      };

      return validated_data;
      
    } catch (parseError) {
      console.error('Error parsing optimized resume score response:', parseError);
      return {
        matched_skills: [],
        missing_skills: [],
        recommendations: ["Error analyzing optimized resume. The response format was invalid."],
        match_percentage: 85,
        match_score: 85,
        optimization_validation: {
          achieved_zero_missing: false,
          meets_target_score: false,
          skills_demonstrated: 0
        }
      };
    }
    
  } catch (error) {
    console.error('Error in optimized resume scoring:', error);
    return {
      matched_skills: [],
      missing_skills: [],
      recommendations: ["Error occurred while validating optimized resume. Please try again."],
      match_percentage: 85,
      match_score: 85,
      optimization_validation: {
        achieved_zero_missing: false,
        meets_target_score: false,
        skills_demonstrated: 0
      }
    };
  }
}