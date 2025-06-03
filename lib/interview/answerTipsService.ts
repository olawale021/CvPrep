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
    
    // Validate and return with fallbacks
    return {
      answer_structure: Array.isArray(result.answer_structure) ? result.answer_structure : [
        "Start with a brief introduction",
        "Provide specific examples",
        "Explain the impact or result",
        "Connect back to the role requirements"
      ],
      key_points: Array.isArray(result.key_points) ? result.key_points : [
        "Be specific and provide concrete examples",
        "Quantify your achievements when possible",
        "Show how your experience relates to the job"
      ],
      skills_to_emphasize: Array.isArray(result.skills_to_emphasize) ? result.skills_to_emphasize : [
        "Relevant technical skills",
        "Problem-solving abilities",
        "Communication skills"
      ],
      mistakes_to_avoid: Array.isArray(result.mistakes_to_avoid) ? result.mistakes_to_avoid : [
        "Being too vague or generic",
        "Focusing on irrelevant experiences",
        "Not providing specific examples"
      ],
      example_answer: typeof result.example_answer === 'string' ? result.example_answer : 
        "In my previous role at [Company], I successfully [specific achievement] which resulted in [quantifiable impact]. This experience taught me [relevant skill] which I believe would be valuable in this position."
    };
  } catch (parseError) {
    console.error("Failed to parse answer tips JSON:", {
      error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
      content: content.substring(0, 500) + '...'
    });
    
    // Return default tips if parsing fails
    return {
      answer_structure: [
        "Start with a brief introduction",
        "Provide specific examples",
        "Explain the impact or result", 
        "Connect back to the role requirements"
      ],
      key_points: [
        "Be specific and provide concrete examples",
        "Quantify your achievements when possible",
        "Show how your experience relates to the job"
      ],
      skills_to_emphasize: [
        "Relevant technical skills",
        "Problem-solving abilities",
        "Communication skills"
      ],
      mistakes_to_avoid: [
        "Being too vague or generic",
        "Focusing on irrelevant experiences",
        "Not providing specific examples"
      ],
      example_answer: "In my previous role at [Company], I successfully [specific achievement] which resulted in [quantifiable impact]. This experience taught me [relevant skill] which I believe would be valuable in this position."
    };
  }
}

export async function generateAnswerTips(
  question: string,
  jobDescription: string
): Promise<AnswerTipsResponse> {
  try {
    // Validate inputs
    if (!question || !jobDescription) {
      throw new Error("Question and job description are required");
    }

    // Create the prompt
    const prompt = createAnswerTipsPrompt(question.trim(), jobDescription.trim());

    // Generate answer tips using OpenAI
    const response = await openai.chat.completions.create({
      model: process.env.GPT_MODEL || "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are an expert interview coach who helps candidates prepare effective answers to interview questions. Always return valid JSON with properly structured arrays and strings." 
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
    const answer_tips = parseAnswerTipsResponse(content);
    
    return {
      question: question.trim(),
      answer_tips
    };
  } catch (error) {
    console.error("Error generating answer tips:", error);
    
    // Return default tips if everything fails
    return {
      question: question.trim(),
      answer_tips: {
        answer_structure: [
          "Start with a brief introduction",
          "Provide specific examples",
          "Explain the impact or result",
          "Connect back to the role requirements"
        ],
        key_points: [
          "Be specific and provide concrete examples",
          "Quantify your achievements when possible",
          "Show how your experience relates to the job"
        ],
        skills_to_emphasize: [
          "Relevant technical skills",
          "Problem-solving abilities", 
          "Communication skills"
        ],
        mistakes_to_avoid: [
          "Being too vague or generic",
          "Focusing on irrelevant experiences",
          "Not providing specific examples"
        ],
        example_answer: "In my previous role at [Company], I successfully [specific achievement] which resulted in [quantifiable impact]. This experience taught me [relevant skill] which I believe would be valuable in this position."
      }
    };
  }
} 