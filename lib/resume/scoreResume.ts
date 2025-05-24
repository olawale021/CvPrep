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

const openaiApiKey = process.env.OPENAI_API_KEY;
let openai: OpenAI | null = null;
if (openaiApiKey) {
  openai = new OpenAI({ apiKey: openaiApiKey });
}

export async function scoreResume(resumeText: string, jobDescription: string): Promise<ResumeScore> {
  // Verify job description has sufficient length
  if (jobDescription.trim().length < 20) {
    console.log("Job description too short for reliable analysis");
    return {
      matched_skills: [],
      missing_skills: [],
      recommendations: ["The job description is too short. Please provide a more detailed job description."],
      match_percentage: 0,
      match_score: 0
    };
  }

  if (!openai) {
    console.log("OpenAI API not available, using basic matching");
    // Return a basic error-state response instead of using the removed fallback method
    return {
      matched_skills: [],
      missing_skills: [],
      recommendations: ["OpenAI API not available. Cannot analyze resume at this time."],
      match_percentage: 0,
      match_score: 0
    };
  }

  try {
    // Extract structured resume information using the new structure
    const structuredResume = await structure_resume(resumeText);
    const segments = await segment_resume_sections(resumeText);
    
    // Prepare the resume data - fix linter errors by using const
    const candidate_skills: string[] = [];
    const candidate_experience: string[] = [];
    const candidate_roles: string[] = [];
    
    // Extract skills information from the structured resume
    let skills_info = "";
    if (structuredResume["Technical Skills"].length > 0) {
      skills_info = structuredResume["Technical Skills"].join("\n");
      // Add skills to candidate_skills
      structuredResume["Technical Skills"].forEach(skill => {
        if (skill.trim().length > 3) {
          candidate_skills.push(skill.trim());
        }
      });
    } else {
      // Fallback to using segments if structured resume didn't work well
      for (const key of ["Skills", "Technical Skills", "Areas of Expertise", "Additional Skills"]) {
        const segment = segments[key] || "";
        if (typeof segment === 'string') {
          skills_info += segment + "\n\n";
          // Extract individual skills from these sections
          for (const line of segment.split('\n')) {
            if (line.trim() && line.trim().length > 3) { // Avoid empty lines and short items
              candidate_skills.push(line.trim());
            }
          }
        }
      }
    }
    
    // Extract experience information from structured resume
    let experience_info = "";
    if (structuredResume["Work Experience"].length > 0) {
      // Format the work experience from structured data
      structuredResume["Work Experience"].forEach(job => {
        experience_info += `${job.role} at ${job.company} (${job.date_range})\n`;
        job.accomplishments.forEach(accomplishment => {
          experience_info += `- ${accomplishment}\n`;
        });
        experience_info += "\n";
        
        // Add to candidate roles
        candidate_roles.push(job.role);
        
        // Add accomplishments to experience
        job.accomplishments.forEach(item => {
          candidate_experience.push(item);
        });
      });
    } else {
      // Fallback to segments
      for (const key of ["Professional Experience", "Experience", "Work Experience"]) {
        const segment = segments[key] || "";
        if (typeof segment === 'string') {
          experience_info += segment + "\n\n";
          // Extract job titles and experience details
          const lines = segment.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Look for job titles/roles
            if (/manager|director|specialist|engineer|developer|analyst|coordinator|assistant|designer|consultant|lead|head|chief/i.test(line)) {
              candidate_roles.push(line.trim());
            }
            // Add lines after a role as experience details
            if (i > 0 && candidate_roles.includes(lines[i-1].trim()) && line.trim()) {
              candidate_experience.push(line.trim());
            }
          }
        }
      }
    }
    
    // Extract summary from structured resume
    let summary = structuredResume.Summary || "";
    if (!summary) {
      // Fallback to segments
      for (const key of ["Summary", "Professional Summary", "Profile"]) {
        const segment = segments[key] || "";
        if (typeof segment === 'string') {
          summary += segment + "\n";
        }
      }
    }
    
    // Use the new AI functions to extract better structured data
    const resumeSkills = await extract_skills_from_text(resumeText);
    const jobRequirements = await extract_job_requirements(jobDescription);
    const jobTerms = await extract_key_job_terms(jobDescription);
    
    // Use AI to do the scoring with structured data
    const prompt = `
    Evaluate this resume against the job description using these scoring criteria:
    
    1. Skills Match (40%):
        - Technical skills alignment
        - Soft skills alignment
        - Experience level match
        - Domain knowledge
    
    2. Experience Relevance (30%):
       - Years of relevant experience
       - Similar role responsibilities
       - Industry alignment
       - Project relevance
    
    3. Education & Certifications (10%):
       - Required qualifications
       - Relevant certifications
       - Specialized training
    
    4. Additional Factors (20%):
       - Keyword match
       - Achievement metrics
       - Leadership experience
       - Location/arrangement compatibility
    
    IMPORTANT:
    - When matching required skills, licenses, or certifications, treat "certifications", "certificates", and "licenses" as equivalent. 
    - If a required license or certificate (e.g., "Door Supervisor License") is present in the candidate's certifications, certificates, or licenses section, do NOT mark it as missing.
    - Only list a skill, license, or certificate as missing if it is truly not present anywhere in the resume, including certifications, certificates, or licenses sections.
    
    Return JSON with:
    - "match_score": overall percentage (0-100)
    - "category_scores": detailed breakdown by category
    - "missing_skills": an array of concise, ATS-friendly skill terms from the job description that are not found in the resume (e.g., "Java", "CI/CD", "AWS","conflict management", "teamwork", "leadership")
    - "matched_skills": an array of concise, ATS-friendly skill terms found in both the job description and the resume (e.g., "Git", "Software Architecture", "Azure", "teamwork" ,"conflict management", "leadership")
    - "recommendations": specific improvements (3-5 items)
    - "alternative_positions": [CRITICAL] For low match scores, suggest 2-3 positions based ONLY on the candidate's skills and experience from their resume. IGNORE the job description completely when suggesting alternative positions.
    
    Resume Summary:
    ${summary}
    
    Candidate Experience:
    ${experience_info}
    
    Candidate Skills:
    ${skills_info}
    
    Structured Resume:
    ${JSON.stringify(structuredResume, null, 2)}
    
    Extracted Resume Skills:
    ${JSON.stringify(resumeSkills)}
    
    Job Requirements:
    ${JSON.stringify(jobRequirements)}
    
    Job Terms:
    ${JSON.stringify(jobTerms)}
    
    Full Resume Text:
    ${resumeText.substring(0, 3000)}  // Limit to first 3000 chars for token reasons
    
    Job Description:
    ${jobDescription}
    `;
    
    console.log("Sending detailed scoring request to OpenAI...");
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert resume analyst that evaluates resumes against job descriptions.
          Be specific, accurate, and actionable in your feedback.
          
          CRITICAL INSTRUCTIONS FOR ALTERNATIVE POSITIONS:
          
          When suggesting alternative positions for low-scoring matches:
          1. Look ONLY at the candidate's skills and experience from their RESUME
          2. COMPLETELY IGNORE the job description when suggesting alternative positions
          3. Suggest jobs they ARE qualified for based on their resume, not jobs they COULD be qualified for
          4. Base recommendations on their strongest demonstrated skills and most recent roles
          5. Match the seniority level of their previous roles
          6. Focus on their actual expertise, not what they're missing for the current job
          7. YOU MUST PROVIDE AT LEAST 2 SPECIFIC JOB TITLES they are qualified for
          
          Convert all skill terms to professional resume format:
          - "make time for others" → "supportiveness" or "active listening"
          - "follow instructions" → "instruction adherence"
          - "maintain positive attitude" → "positive mindset"
          
          Only return properly formatted JSON with complete fields.`
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });
    
    try {
      // Extract and clean the response
      const content = response.choices[0].message.content || '';
      const score_data = JSON.parse(content);
      
      // Validate the result with defaults if fields are missing
      const validated_data: ResumeScore = {
        matched_skills: score_data.matched_skills || [],
        missing_skills: score_data.missing_skills || [], 
        recommendations: score_data.recommendations || ["Enhance resume with more specific skills and experience"],
        match_percentage: Math.min(100, Math.max(0, score_data.match_score || 50)),
        match_score: Math.min(100, Math.max(0, score_data.match_score || 50)),
        category_scores: score_data.category_scores || {
          skills_match: 20,
          experience_relevance: 15,
          education_certifications: 7,
          additional_factors: 8
        },
        alternative_positions: undefined
      };
      
      // For low scores, ensure we have alternative positions
      if (validated_data.match_percentage < 40) {
        let alternative_positions = score_data.alternative_positions || [];
        
        // If no positions provided, generate defaults based on resume data only
        if (!alternative_positions || alternative_positions.length === 0) {
          // Use extracted candidate roles if available
          if (candidate_roles.length > 0) {
            // Select the most promising roles based on candidate's skills
            alternative_positions = candidate_roles.slice(0, 2);
          } else {
            // Generate positions based on extracted skills
            const skills_text = resumeSkills.join(" ").toLowerCase();
            
            if (skills_text.includes("programming") || skills_text.includes("software") || 
                skills_text.includes("developer") || skills_text.includes("python")) {
              alternative_positions = ["Software Developer", "Application Engineer"];
            } else if (skills_text.includes("design") || skills_text.includes("photoshop") ||
                       skills_text.includes("ux") || skills_text.includes("ui")) {
              alternative_positions = ["Graphic Designer", "UX/UI Designer"];
            } else if (skills_text.includes("teach") || skills_text.includes("education") ||
                       skills_text.includes("curriculum") || skills_text.includes("classroom")) {
              alternative_positions = ["Educational Consultant", "Curriculum Developer"];
            } else if (skills_text.includes("care") || skills_text.includes("nurse") ||
                       skills_text.includes("patient") || skills_text.includes("health")) {
              alternative_positions = ["Healthcare Specialist", "Patient Care Coordinator"];
            } else if (skills_text.includes("marketing") || skills_text.includes("social media") ||
                       skills_text.includes("branding")) {
              alternative_positions = ["Marketing Specialist", "Digital Marketing Coordinator"];
            } else if (skills_text.includes("manage") || skills_text.includes("leadership") ||
                       skills_text.includes("strategy") || skills_text.includes("team")) {
              alternative_positions = ["Project Manager", "Team Lead"];
            } else if (resumeText.toLowerCase().includes("software") || 
                       resumeText.toLowerCase().includes("developer")) {
              alternative_positions = ["Software Developer", "Application Engineer"];
            } else if (resumeText.toLowerCase().includes("marketing")) {
              alternative_positions = ["Marketing Specialist", "Digital Marketing Coordinator"];
            } else if (resumeText.toLowerCase().includes("teach") || 
                       resumeText.toLowerCase().includes("education")) {
              alternative_positions = ["Educational Consultant", "Curriculum Developer"];
            } else if (resumeText.toLowerCase().includes("care") || 
                       resumeText.toLowerCase().includes("health")) {
              alternative_positions = ["Healthcare Specialist", "Patient Care Coordinator"];
            } else {
              alternative_positions = ["Professional aligned with your skills", "Specialist in your field"];
            }
          }
          
          // Add the positions to the recommendations
          const position_list = alternative_positions.join(", ");
          if (!validated_data.recommendations.some(r => r.includes("Consider applying for"))) {
            validated_data.recommendations.unshift(
              `Consider applying for positions that better match your experience, such as: ${position_list}`
            );
          }
          
          // Ensure alternative_positions is in the response
          validated_data.alternative_positions = alternative_positions;
        } else {
          validated_data.alternative_positions = alternative_positions;
        }
      }
      
      console.log("OpenAI scoring complete:", validated_data);
      return validated_data;
      
    } catch (parseError) {
      console.error("Failed to parse OpenAI scoring response:", parseError);
      return {
        matched_skills: [],
        missing_skills: [],
        recommendations: ["Error analyzing resume match. Please try again."],
        match_percentage: 0,
        match_score: 0
      };
    }
  } catch (error) {
    console.error("OpenAI scoring error:", error);
    return {
      matched_skills: [],
      missing_skills: [],
      recommendations: ["Error analyzing resume match. Please try again."],
      match_percentage: 0,
      match_score: 0
    };
  }
} 