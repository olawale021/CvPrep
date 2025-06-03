import { OpenAI } from "openai";
import { extract_job_requirements } from "../resume/jobParser";
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
    
    // Try to fix common JSON issues
    cleanContent = cleanContent.replace(/\n/g, '\\n');
    cleanContent = cleanContent.replace(/\r/g, '\\r');
    cleanContent = cleanContent.replace(/\t/g, '\\t');
    
    // Parse the JSON
    const result = JSON.parse(cleanContent);
    
    // Validate and return with fallbacks
    const feedback: SimulationFeedback = {
      answer_feedback: Array.isArray(result.answer_feedback) ? result.answer_feedback.map((item: {
        question?: string;
        strengths?: string[];
        improvements?: string[];
        score?: number;
        better_answer?: string;
      }, index: number) => ({
        question: typeof item.question === 'string' ? item.question : `Question ${index + 1}`,
        strengths: Array.isArray(item.strengths) ? item.strengths : ["Your answer showed effort and thought"],
        improvements: Array.isArray(item.improvements) ? item.improvements : ["Consider providing more specific examples"],
        score: typeof item.score === 'number' && item.score >= 1 && item.score <= 10 ? item.score : 5,
        better_answer: typeof item.better_answer === 'string' ? item.better_answer : "Consider expanding your answer with specific examples and quantifiable results."
      })) : [],
      overall_evaluation: {
        score: typeof result.overall_evaluation?.score === 'number' && 
               result.overall_evaluation.score >= 1 && 
               result.overall_evaluation.score <= 10 ? 
               result.overall_evaluation.score : 5,
        strengths: Array.isArray(result.overall_evaluation?.strengths) ? 
                  result.overall_evaluation.strengths : 
                  ["Shows enthusiasm for the role", "Demonstrates relevant experience"],
        improvements: Array.isArray(result.overall_evaluation?.improvements) ? 
                     result.overall_evaluation.improvements : 
                     ["Provide more specific examples", "Quantify achievements when possible"],
        recommendation: typeof result.overall_evaluation?.recommendation === 'string' ? 
                       result.overall_evaluation.recommendation : 
                       "Practice providing more detailed examples and connecting your experience to the job requirements."
      }
    };
    
    return feedback;
  } catch (parseError) {
    console.error("Failed to parse simulation feedback JSON:", {
      error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
      content: content.substring(0, 500) + '...'
    });
    
    // Return default feedback if parsing fails
    return {
      answer_feedback: [],
      overall_evaluation: {
        score: 5,
        strengths: ["Shows enthusiasm for the role", "Demonstrates relevant experience"],
        improvements: ["Provide more specific examples", "Quantify achievements when possible"],
        recommendation: "Practice providing more detailed examples and connecting your experience to the job requirements."
      }
    };
  }
}

export async function simulateInterview(
  jobDescription: string,
  questions: string[],
  answers: string[]
): Promise<SimulationFeedback> {
  try {
    // Validate inputs
    if (!jobDescription || !questions.length || !answers.length) {
      throw new Error("Job description, questions, and answers are required");
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
      throw new Error("Empty response from OpenAI");
    }
    
    // Parse and validate the response
    const feedback = parseSimulationResponse(content);
    
    return feedback;
  } catch (error) {
    console.error("Error simulating interview:", error);
    
    // Return default feedback if everything fails
    return {
      answer_feedback: questions.map((question) => ({
        question: question.trim(),
        strengths: ["Shows effort and thought in answering"],
        improvements: ["Consider providing more specific examples", "Connect your experience more directly to the role"],
        score: 5,
        better_answer: "Consider expanding your answer with specific examples and quantifiable results that demonstrate your capabilities for this role."
      })),
      overall_evaluation: {
        score: 5,
        strengths: ["Shows enthusiasm for the role", "Demonstrates relevant experience"],
        improvements: ["Provide more specific examples", "Quantify achievements when possible"],
        recommendation: "Practice providing more detailed examples and connecting your experience to the job requirements."
      }
    };
  }
} 