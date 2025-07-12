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

IMPORTANT: Return ONLY a valid JSON object with these exact keys:
- answer_structure (array of steps)
- key_points (array)
- skills_to_emphasize (array)
- mistakes_to_avoid (array)
- example_answer (string)

Do NOT include any text before or after the JSON object. Do NOT include markdown formatting. Start your response with { and end with }.`;
}

function parseAnswerTipsResponse(content: string): AnswerTips {
  try {
    // Clean the content before parsing - be more careful with JSON
    let cleanContent = content.trim();
    
    // Remove any potential markdown formatting
    cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Remove any leading/trailing whitespace again after markdown removal
    cleanContent = cleanContent.trim();
    
    // Log the content for debugging (first 500 chars)

    
    // Check if content starts with a JSON object
    if (!cleanContent.startsWith('{')) {
      console.warn("Response doesn't start with JSON object, attempting to extract JSON");
      
      // Try to find JSON object within the content
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
    
      } else {
        throw new Error("No valid JSON object found in response");
      }
    }
    
    // Parse the JSON directly without string manipulation that could corrupt it
    const result = JSON.parse(cleanContent);
    
    // Validate and return - create with defaults if missing
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
      content: content.substring(0, 1000) + (content.length > 1000 ? '...' : ''),
      contentLength: content.length
    });
    
    // Try fallback parsing for malformed responses
    try {
      return parseAnswerTipsFallback(content);
    } catch (fallbackError) {
      console.error("Fallback parsing also failed:", fallbackError);
      throw new Error(`Failed to generate answer tips: ${errorMessage}. Please try again.`);
    }
  }
}

function parseAnswerTipsFallback(content: string): AnswerTips {
  
  
  // Try to extract structured data from potentially corrupted JSON using regex
  const result: AnswerTips = {
    answer_structure: [],
    key_points: [],
    skills_to_emphasize: [],
    mistakes_to_avoid: [],
    example_answer: ''
  };
  
  // Extract arrays and strings using regex patterns
  const patterns = [
    { key: 'answer_structure', pattern: /"answer_structure"\s*:\s*\[([\s\S]*?)\]/ },
    { key: 'key_points', pattern: /"key_points"\s*:\s*\[([\s\S]*?)\]/ },
    { key: 'skills_to_emphasize', pattern: /"skills_to_emphasize"\s*:\s*\[([\s\S]*?)\]/ },
    { key: 'mistakes_to_avoid', pattern: /"mistakes_to_avoid"\s*:\s*\[([\s\S]*?)\]/ },
    { key: 'example_answer', pattern: /"example_answer"\s*:\s*"([^"]*)"/ }
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern.pattern);
    if (match && match[1]) {
      try {
        if (pattern.key === 'example_answer') {
          // For example_answer, just extract the string
          result.example_answer = match[1];
        } else {
          // For arrays, extract individual items
          const arrayContent = match[1];
          const itemMatches = arrayContent.match(/"([^"]+)"/g);
          if (itemMatches) {
            const items = itemMatches.map(item => item.slice(1, -1)); // Remove quotes
            
            // Type-safe property assignment
            switch (pattern.key) {
              case 'answer_structure':
                result.answer_structure = items;
                break;
              case 'key_points':
                result.key_points = items;
                break;
              case 'skills_to_emphasize':
                result.skills_to_emphasize = items;
                break;
              case 'mistakes_to_avoid':
                result.mistakes_to_avoid = items;
                break;
            }
          }
        }
      } catch (err) {
        console.warn(`Failed to parse ${pattern.key} in fallback mode:`, err);
      }
    }
  }
  
  // Validate that we have at least some content
  const hasContent = result.answer_structure.length > 0 || 
                    result.key_points.length > 0 || 
                    result.skills_to_emphasize.length > 0 ||
                    result.mistakes_to_avoid.length > 0 ||
                    result.example_answer.length > 0;
  
  if (!hasContent) {
    throw new Error('No valid answer tips found even in fallback parsing');
  }
  
  
  
  return result;
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
          content: "You are an expert career coach who provides specific, actionable advice for interview questions. Always return complete, valid JSON with properly structured tip arrays and examples. Ensure the response is not truncated." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000, // Added to prevent truncation
      response_format: { type: "json_object" }
    });
    
    // Log response details for debugging

    
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