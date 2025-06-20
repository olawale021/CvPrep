import { OpenAI } from "openai";
import { extract_job_requirements } from "../resume/jobParser";
import { structure_resume, StructuredResume } from "../resume/resumeParser";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface JobRequirements {
  required_skills: string[];
  preferred_skills: string[];
  experience_level: string;
  education_requirements: string[];
  job_responsibilities: string[];
}

export interface InterviewQuestionsResponse {
  technical_questions: string[];
  behavioral_questions: string[];
  situational_questions: string[];
  role_specific_questions: string[];
  culture_fit_questions: string[];
}

export interface InterviewMetadata {
  job_analyzed: boolean;
  resume_analyzed: boolean;
  question_count: number;
  categories: number;
}

// Helper to truncate text to avoid token limits
function truncateText(text: string, maxLength: number = 8000): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  // Try to truncate at a sentence boundary near the limit
  const truncated = text.substring(0, maxLength);
  const lastSentence = truncated.lastIndexOf('.');
  const lastNewline = truncated.lastIndexOf('\n');
  
  // Use the last sentence or newline boundary, or just truncate at the limit
  const cutPoint = Math.max(lastSentence, lastNewline);
  return cutPoint > maxLength * 0.8 ? text.substring(0, cutPoint + 1) : truncated + '...';
}

// Helper to truncate text to avoid token limits

function createPromptWithResume(
  jobDescription: string,
  jobRequirements: JobRequirements,
  resumeData: StructuredResume,
  questionCount: number
): string {
  return `Create a set of interview questions for a candidate applying to this job.

The questions should be tailored to both the job requirements and the candidate's resume.

Generate ${questionCount} questions for each of these categories:
1. Technical questions that assess specific skills required for this role
2. Behavioral questions related to the candidate's past experiences
3. Situational questions to evaluate problem-solving abilities
4. Role-specific questions about the job responsibilities
5. Company/culture fit questions

Job Description:
${jobDescription}

Job Requirements:
${JSON.stringify(jobRequirements, null, 2)}

Candidate Resume:
${JSON.stringify(resumeData, null, 2)}

Return as JSON with these exact categories:
- technical_questions (array)
- behavioral_questions (array)
- situational_questions (array)
- role_specific_questions (array)
- culture_fit_questions (array)`;
}

function createPromptWithoutResume(
  jobDescription: string,
  jobRequirements: JobRequirements,
  questionCount: number
): string {
  return `Create a set of interview questions for candidates applying to this job.

Generate ${questionCount} questions for each of these categories:
1. Technical questions that assess specific skills required for this role
2. Behavioral questions related to key responsibilities
3. Situational questions to evaluate problem-solving abilities
4. Role-specific questions about the job responsibilities
5. Company/culture fit questions

Job Description:
${jobDescription}

Job Requirements:
${JSON.stringify(jobRequirements, null, 2)}

Return as JSON with these exact categories:
- technical_questions (array)
- behavioral_questions (array)
- situational_questions (array)
- role_specific_questions (array)
- culture_fit_questions (array)`;
}

async function parseResumeFile(resumeFile: File): Promise<StructuredResume | null> {
  try {
    // Convert File to text
    const text = await resumeFile.text();
    
    // Validate resume file content
    if (!text || text.trim().length < 50) {
      console.warn("Resume file is empty or too short, proceeding without resume analysis");
      return null;
    }

    // Truncate resume if too large to avoid token limit errors
    const truncatedText = truncateText(text);
    
    try {
      // Use the existing structure_resume function
      const resumeData = await structure_resume(truncatedText);
      
      // Validate the structured resume data
      if (!resumeData || typeof resumeData !== 'object') {
        console.warn("Resume structuring returned invalid data, proceeding without resume analysis");
        return null;
      }
      
      return resumeData;
    } catch (structureError) {
      console.error("Error structuring resume for interview questions:", {
        error: structureError instanceof Error ? structureError.message : 'Unknown structure error',
        resumeLength: text.length
      });
      return null;
    }
  } catch (error) {
    console.error("Error parsing resume file for interview questions:", {
      error: error instanceof Error ? error.message : 'Unknown parse error',
      fileName: resumeFile.name,
      fileSize: resumeFile.size
    });
    return null;
  }
}

function parseInterviewQuestionsResponse(content: string): InterviewQuestionsResponse {
  try {
    // Clean the content before parsing
    let cleanContent = content.trim();
    
    // Remove any potential markdown formatting
    cleanContent = cleanContent.replace(/```json\n?|```\n?/g, '');
    
    // Try to fix common JSON issues
    cleanContent = cleanContent.replace(/\n/g, '\\n');
    cleanContent = cleanContent.replace(/\r/g, '\\r');
    cleanContent = cleanContent.replace(/\t/g, '\\t');
    
    // Parse the JSON
    const questions = JSON.parse(cleanContent);
    
    // Validate the structure
    if (typeof questions !== 'object' || questions === null) {
      throw new Error('Invalid questions object structure');
    }
    
    // Ensure all expected categories exist - throw error if missing
    const result: InterviewQuestionsResponse = {
      technical_questions: Array.isArray(questions.technical_questions) ? questions.technical_questions : [],
      behavioral_questions: Array.isArray(questions.behavioral_questions) ? questions.behavioral_questions : [],
      situational_questions: Array.isArray(questions.situational_questions) ? questions.situational_questions : [],
      role_specific_questions: Array.isArray(questions.role_specific_questions) ? questions.role_specific_questions : [],
      culture_fit_questions: Array.isArray(questions.culture_fit_questions) ? questions.culture_fit_questions : []
    };
    
    // Validate that we have at least some questions
    const totalQuestions = Object.values(result).reduce((sum, arr) => sum + arr.length, 0);
    if (totalQuestions === 0) {
      throw new Error('No valid questions found in AI response');
    }
    
    return result;
  } catch (parseError) {
    const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parse error';
    console.error("Failed to parse interview questions JSON:", {
      error: errorMessage,
      content: content.substring(0, 500) + '...'
    });
    
    // Don't return default questions - throw the actual error
    throw new Error(`Failed to generate interview questions: ${errorMessage}. Please try again.`);
  }
}

export async function generateInterviewQuestions(
  jobDescription: string,
  questionCount: number = 5,
  resumeFile?: File | null
): Promise<{ questions: InterviewQuestionsResponse; metadata: InterviewMetadata }> {
  try {
    // Parse resume if provided
    let resumeData: StructuredResume | null = null;
    if (resumeFile) {
      resumeData = await parseResumeFile(resumeFile);
    }

    // Get job requirements using the existing function
    const jobRequirements = await extract_job_requirements(jobDescription);

    // Create prompt based on whether we have resume data
    const prompt = resumeData 
      ? createPromptWithResume(jobDescription, jobRequirements, resumeData, questionCount)
      : createPromptWithoutResume(jobDescription, jobRequirements, questionCount);

    // Generate questions using OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are an expert interviewer who creates tailored interview questions based on job descriptions and candidate profiles. Always return valid JSON with properly structured question arrays." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    // Handle possible null content
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI API");
    }
    
    // Parse and validate the response
    const questions = parseInterviewQuestionsResponse(content);
    
    return {
      questions,
      metadata: {
        job_analyzed: true,
        resume_analyzed: !!resumeData,
        question_count: questionCount,
        categories: Object.keys(questions).length
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error("Error generating interview questions:", error);
    
    // Don't return default questions - throw the actual error
    throw new Error(`Interview question generation failed: ${errorMessage}`);
  }
} 