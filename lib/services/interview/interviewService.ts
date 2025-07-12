import { OpenAI } from "openai";
import { extract_job_requirements } from "../resume/resumeUtils/jobParser";
import { structure_resume, StructuredResume } from "../resume/resumeUtils/resumeParser";
import { AnswerTips } from "./answerTipsService";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface JobRequirements {
  required_skills: string[];
  preferred_skills: string[];
  experience_level: string;
  education_requirements: string[];
  job_responsibilities: string[];
}

export interface QuestionWithTips {
  question: string;
  answer_tips: AnswerTips;
}

export interface InterviewQuestionsResponse {
  technical_questions: string[];
  behavioral_questions: string[];
  situational_questions: string[];
  role_specific_questions: string[];
  culture_fit_questions: string[];
}

export interface InterviewQuestionsWithTipsResponse {
  technical_questions: QuestionWithTips[];
  behavioral_questions: QuestionWithTips[];
  situational_questions: QuestionWithTips[];
  role_specific_questions: QuestionWithTips[];
  culture_fit_questions: QuestionWithTips[];
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
    // Clean the content before parsing - be more careful with JSON
    let cleanContent = content.trim();
    
    // Remove any potential markdown formatting
    cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Remove any leading/trailing whitespace again after markdown removal
    cleanContent = cleanContent.trim();
    

    
    // Parse the JSON directly without string manipulation that could corrupt it
    const questions = JSON.parse(cleanContent);
    
    // Validate the structure
    if (typeof questions !== 'object' || questions === null) {
      throw new Error('Invalid questions object structure');
    }
    
    // Ensure all expected categories exist - create with defaults if missing
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
      content: content.substring(0, 1000) + (content.length > 1000 ? '...' : ''),
      contentLength: content.length
    });
    
    // Try fallback parsing for partially corrupted JSON
    try {
      return parseInterviewQuestionsResponseFallback(content);
    } catch (fallbackError) {
      console.error("Fallback parsing also failed:", fallbackError);
      // Don't return default questions - throw the actual error
      throw new Error(`Failed to generate interview questions: ${errorMessage}. Please try again.`);
    }
  }
}

function parseInterviewQuestionsResponseFallback(content: string): InterviewQuestionsResponse {

  
  // Try to extract questions from partially corrupted JSON using regex
  const result: InterviewQuestionsResponse = {
    technical_questions: [],
    behavioral_questions: [],
    situational_questions: [],
    role_specific_questions: [],
    culture_fit_questions: []
  };
  
  // Extract arrays of questions using regex patterns
  const categories = [
    { key: 'technical_questions', pattern: /"technical_questions"\s*:\s*\[([\s\S]*?)\]/ },
    { key: 'behavioral_questions', pattern: /"behavioral_questions"\s*:\s*\[([\s\S]*?)\]/ },
    { key: 'situational_questions', pattern: /"situational_questions"\s*:\s*\[([\s\S]*?)\]/ },
    { key: 'role_specific_questions', pattern: /"role_specific_questions"\s*:\s*\[([\s\S]*?)\]/ },
    { key: 'culture_fit_questions', pattern: /"culture_fit_questions"\s*:\s*\[([\s\S]*?)\]/ }
  ];
  
  for (const category of categories) {
    const match = content.match(category.pattern);
    if (match && match[1]) {
      try {
        // Extract individual questions from the array content
        const questionsText = match[1];
        const questionMatches = questionsText.match(/"([^"]+)"/g);
        if (questionMatches) {
          const questions = questionMatches.map(q => q.slice(1, -1)); // Remove quotes
          
          // Type-safe property assignment
          switch (category.key) {
            case 'technical_questions':
              result.technical_questions = questions;
              break;
            case 'behavioral_questions':
              result.behavioral_questions = questions;
              break;
            case 'situational_questions':
              result.situational_questions = questions;
              break;
            case 'role_specific_questions':
              result.role_specific_questions = questions;
              break;
            case 'culture_fit_questions':
              result.culture_fit_questions = questions;
              break;
          }
        }
      } catch (err) {
        console.warn(`Failed to parse ${category.key} in fallback mode:`, err);
      }
    }
  }
  
  // Validate that we have at least some questions
  const totalQuestions = Object.values(result).reduce((sum, arr) => sum + arr.length, 0);
  if (totalQuestions === 0) {
    throw new Error('No valid questions found even in fallback parsing');
  }
  

  
  return result;
}

// Helper function to generate answer tips for a single question
async function generateAnswerTipsForQuestion(
  question: string,
  jobDescription: string
): Promise<AnswerTips> {
  try {
    const prompt = `Provide comprehensive guidance for answering this interview question for the specified job.

Interview Question:
${question}

Job Description:
${jobDescription}

Your response should include:
1. A suggested answer structure (bullet points)
2. Key points to include in the answer
3. Skills/experiences to emphasize
4. Common mistakes to avoid
5. A brief example answer (2-3 sentences)

IMPORTANT: Return ONLY a valid JSON object with these exact keys:
- answer_structure (array of steps)
- key_points (array)
- skills_to_emphasize (array)
- mistakes_to_avoid (array)
- example_answer (string)

Do NOT include any text before or after the JSON object. Do NOT include markdown formatting. Start your response with { and end with }.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are an expert career coach who provides specific, actionable advice for interview questions. Always return complete, valid JSON with properly structured tip arrays and examples. Ensure the response is not truncated." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI API");
    }

    // Clean and parse the response
    let cleanContent = content.trim();
    cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    cleanContent = cleanContent.trim();

    // Check if content starts with a JSON object
    if (!cleanContent.startsWith('{')) {
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
    }

    const result = JSON.parse(cleanContent);

    return {
      answer_structure: Array.isArray(result.answer_structure) ? result.answer_structure : [],
      key_points: Array.isArray(result.key_points) ? result.key_points : [],
      skills_to_emphasize: Array.isArray(result.skills_to_emphasize) ? result.skills_to_emphasize : [],
      mistakes_to_avoid: Array.isArray(result.mistakes_to_avoid) ? result.mistakes_to_avoid : [],
      example_answer: typeof result.example_answer === 'string' ? result.example_answer : ''
    };
  } catch (error) {
    console.error(`Error generating answer tips for question: ${question.substring(0, 50)}...`, error);
    // Return empty tips if generation fails to avoid breaking the whole process
    return {
      answer_structure: [],
      key_points: [],
      skills_to_emphasize: [],
      mistakes_to_avoid: [],
      example_answer: 'Answer tips could not be generated for this question.'
    };
  }
}

// Helper function to convert questions array to questions with tips
async function generateQuestionsWithTips(
  questions: string[],
  jobDescription: string
): Promise<QuestionWithTips[]> {
  const questionsWithTips: QuestionWithTips[] = [];
  
  // Process questions in batches to avoid overwhelming the API
  const batchSize = 3;
  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (question) => {
      const answer_tips = await generateAnswerTipsForQuestion(question, jobDescription);
      return { question, answer_tips };
    });
    
    const batchResults = await Promise.all(batchPromises);
    questionsWithTips.push(...batchResults);
    
    // Small delay between batches to be respectful to the API
    if (i + batchSize < questions.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return questionsWithTips;
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
          content: "You are an expert interviewer who creates tailored interview questions based on job descriptions and candidate profiles. Always return complete, valid JSON with properly structured question arrays. Ensure the response is not truncated and contains all requested categories." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000, // Ensure we have enough tokens for complete response
      response_format: { type: "json_object" }
    });
    

    
    // Check if response was truncated
    if (response.choices[0].finish_reason === 'length') {
      console.warn("OpenAI response was truncated due to length limit");
    }
    
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

// New function that generates questions with answer tips
export async function generateInterviewQuestionsWithTips(
  jobDescription: string,
  questionCount: number = 5,
  resumeFile?: File | null
): Promise<{ questions: InterviewQuestionsWithTipsResponse; metadata: InterviewMetadata }> {
  try {

    
    // First generate the questions using the existing function
    const { questions: basicQuestions, metadata } = await generateInterviewQuestions(
      jobDescription,
      questionCount,
      resumeFile
    );



    // Generate answer tips for each category of questions
    const [
      technicalWithTips,
      behavioralWithTips,
      situationalWithTips,
      roleSpecificWithTips,
      cultureFitWithTips
    ] = await Promise.all([
      generateQuestionsWithTips(basicQuestions.technical_questions, jobDescription),
      generateQuestionsWithTips(basicQuestions.behavioral_questions, jobDescription),
      generateQuestionsWithTips(basicQuestions.situational_questions, jobDescription),
      generateQuestionsWithTips(basicQuestions.role_specific_questions, jobDescription),
      generateQuestionsWithTips(basicQuestions.culture_fit_questions, jobDescription)
    ]);

    const questionsWithTips: InterviewQuestionsWithTipsResponse = {
      technical_questions: technicalWithTips,
      behavioral_questions: behavioralWithTips,
      situational_questions: situationalWithTips,
      role_specific_questions: roleSpecificWithTips,
      culture_fit_questions: cultureFitWithTips
    };



    return {
      questions: questionsWithTips,
      metadata: {
        ...metadata,
        // Update metadata to reflect that we have tips
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error("Error generating interview questions with tips:", error);
    
    throw new Error(`Interview question with tips generation failed: ${errorMessage}`);
  }
} 