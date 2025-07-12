import { OpenAI } from "openai";
import { extract_job_requirements } from "../resume/resumeUtils/jobParser";
import { JobRequirements } from "./interviewService";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface QAPair {
  question: string;
  answer: string;
}

export interface AnswerFeedback {
  question: string;
  strengths: string[];
  improvements: string[];
  score: number;
  better_answer: string;
}

export interface OverallEvaluation {
  score: number;
  strengths: string[];
  improvements: string[];
  recommendation: string;
}

export interface SimulationFeedback {
  answer_feedback: AnswerFeedback[];
  overall_evaluation: OverallEvaluation;
}

function createSimulationPrompt(
  jobDescription: string,
  jobRequirements: JobRequirements,
  qaPairs: QAPair[]
): string {
  return `Evaluate these interview answers for the specified job.

Job Description:
${jobDescription}

Job Requirements:
${JSON.stringify(jobRequirements, null, 2)}

Question-Answer Pairs:
${JSON.stringify(qaPairs, null, 2)}

For each answer, provide:
1. Strengths (what was good)
2. Areas for improvement
3. Score (1-10)
4. Suggested better answer

Also provide an overall evaluation with:
1. Overall score (1-10)
2. General strengths
3. General improvement areas
4. Final recommendation

Return as JSON with:
- answer_feedback (array of objects with question, strengths, improvements, score, better_answer)
- overall_evaluation (object with score, strengths, improvements, recommendation)`;
}

function parseSimulationResponse(content: string): SimulationFeedback {
  try {

    
    // Clean the content before parsing
    let cleanContent = content.trim();
    
    // Remove any potential markdown formatting
    cleanContent = cleanContent.replace(/```json\n?|```\n?/g, '');
    
    // Remove any leading/trailing whitespace again after markdown removal
    cleanContent = cleanContent.trim();
    
        // Try to parse the JSON directly first
    let result;
    try {
      result = JSON.parse(cleanContent);
    } catch {
 
      
      // If direct parsing fails, try more aggressive cleaning
      // Replace unescaped newlines, tabs, and carriage returns
      cleanContent = cleanContent
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
        // Fix double escaping that might have occurred
        .replace(/\\\\n/g, '\\n')
        .replace(/\\\\r/g, '\\r')
        .replace(/\\\\t/g, '\\t');
      
      // Try parsing again
      result = JSON.parse(cleanContent);
    }
    

    
    // Validate and return - throw error if invalid structure
    const feedback: SimulationFeedback = {
      answer_feedback: Array.isArray(result.answer_feedback) ? result.answer_feedback.map((item: {
        question?: string;
        strengths?: string[];
        improvements?: string[];
        score?: number;
        better_answer?: string;
      }, index: number) => ({
        question: typeof item.question === 'string' ? item.question : `Question ${index + 1}`,
        strengths: Array.isArray(item.strengths) ? item.strengths : [],
        improvements: Array.isArray(item.improvements) ? item.improvements : [],
        score: typeof item.score === 'number' && item.score >= 1 && item.score <= 10 ? item.score : 0,
        better_answer: typeof item.better_answer === 'string' ? item.better_answer : ''
      })) : [],
      overall_evaluation: {
        score: typeof result.overall_evaluation?.score === 'number' && 
               result.overall_evaluation.score >= 1 && 
               result.overall_evaluation.score <= 10 ? 
               result.overall_evaluation.score : 0,
        strengths: Array.isArray(result.overall_evaluation?.strengths) ? 
                  result.overall_evaluation.strengths : [],
        improvements: Array.isArray(result.overall_evaluation?.improvements) ? 
                     result.overall_evaluation.improvements : [],
        recommendation: typeof result.overall_evaluation?.recommendation === 'string' ? 
                       result.overall_evaluation.recommendation : ''
      }
    };
    
    // Validate that we have meaningful feedback
    const hasValidFeedback = feedback.answer_feedback.length > 0 && 
                            feedback.overall_evaluation.score > 0;
    
    if (!hasValidFeedback) {
      throw new Error('No valid simulation feedback found in AI response');
    }
    
    return feedback;
  } catch (parseError) {
    const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parse error';
    console.error("Failed to parse simulation feedback JSON:", {
      error: errorMessage,
      content: content.substring(0, 500) + '...'
    });
    
    // Don't return default feedback - throw the actual error
    throw new Error(`Failed to generate simulation feedback: ${errorMessage}. Please try again.`);
  }
}

export async function simulateInterview(
  jobDescription: string,
  questions: string[],
  answers: string[]
): Promise<SimulationFeedback> {
  try {

    
    // Validate inputs
    if (!jobDescription || jobDescription.trim().length === 0) {
      throw new Error("Job description is required for interview simulation");
    }

    if (!questions.length || !answers.length) {
      throw new Error("Questions and answers are required for interview simulation");
    }

    if (questions.length !== answers.length) {
      throw new Error("Question and answer count mismatch");
    }

    // Get job requirements
    const jobRequirements = await extract_job_requirements(jobDescription);

    // Create Q&A pairs
    const qaPairs: QAPair[] = questions.map((q, i) => ({ 
      question: q.trim(), 
      answer: answers[i].trim() 
    }));

    // Create the prompt
    const prompt = createSimulationPrompt(jobDescription.trim(), jobRequirements, qaPairs);


    
    // Generate feedback using OpenAI
    const response = await openai.chat.completions.create({
      model: process.env.GPT_MODEL || "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are an expert interviewer who provides constructive feedback on interview answers. Always return valid JSON with properly structured feedback arrays and evaluation objects." 
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
    const feedback = parseSimulationResponse(content);
    

    return feedback;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error("Error simulating interview:", error);
    
    // Don't return default feedback - throw the actual error
    throw new Error(`Interview simulation failed: ${errorMessage}`);
  }
} 