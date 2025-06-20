import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AnswerTips {
  answer_structure: string[];
  key_points: string[];
  skills_to_emphasize: string[];
  mistakes_to_avoid: string[];
  example_answer: string;
}

export interface AnswerTipsResponse {
  question: string;
  answer_tips: AnswerTips;
}

function createAnswerTipsPrompt(question: string, jobDescription: string): string {
  return `Provide comprehensive guidance for answering this interview question for the specified job.

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

Return as JSON with these exact keys:
- answer_structure (array of steps)
- key_points (array)
- skills_to_emphasize (array)
- mistakes_to_avoid (array)
- example_answer (string)`;
}

function parseAnswerTipsResponse(content: string): AnswerTips {
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
    
    // Validate and return - throw error if invalid structure
    const answerTips: AnswerTips = {
      answer_structure: Array.isArray(result.answer_structure) ? result.answer_structure : [],
      key_points: Array.isArray(result.key_points) ? result.key_points : [],
      skills_to_emphasize: Array.isArray(result.skills_to_emphasize) ? result.skills_to_emphasize : [],
      mistakes_to_avoid: Array.isArray(result.mistakes_to_avoid) ? result.mistakes_to_avoid : [],
      example_answer: typeof result.example_answer === 'string' ? result.example_answer : ''
    };
    
    // Validate that we have meaningful content
    const hasContent = answerTips.answer_structure.length > 0 || 
                      answerTips.key_points.length > 0 || 
                      answerTips.skills_to_emphasize.length > 0 ||
                      answerTips.example_answer.length > 0;
    
    if (!hasContent) {
      throw new Error('No valid answer tips found in AI response');
    }
    
    return answerTips;
  } catch (parseError) {
    const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parse error';
    console.error("Failed to parse answer tips JSON:", {
      error: errorMessage,
      content: content.substring(0, 500) + '...'
    });
    
    // Don't return default tips - throw the actual error
    throw new Error(`Failed to generate answer tips: ${errorMessage}. Please try again.`);
  }
}

export async function generateAnswerTips(
  question: string,
  jobDescription: string
): Promise<AnswerTipsResponse> {
  try {
    // Validate inputs
    if (!question || question.trim().length === 0) {
      throw new Error("Question is required to generate answer tips");
    }
    
    if (!jobDescription || jobDescription.trim().length === 0) {
      throw new Error("Job description is required to generate answer tips");
    }

    // Create the prompt
    const prompt = createAnswerTipsPrompt(question.trim(), jobDescription.trim());

    // Generate answer tips using OpenAI
    const response = await openai.chat.completions.create({
      model: process.env.GPT_MODEL || "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are an expert career coach who provides specific, actionable advice for interview questions. Always return valid JSON with properly structured tip arrays and examples." 
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
    const answerTips = parseAnswerTipsResponse(content);
    
    return {
      question: question.trim(),
      answer_tips: answerTips
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error("Error generating answer tips:", error);
    
    // Don't return default tips - throw the actual error
    throw new Error(`Answer tips generation failed: ${errorMessage}`);
  }
} 