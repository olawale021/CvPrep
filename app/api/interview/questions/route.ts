import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { extract_job_requirements } from "../../../../lib/resume/jobParser";
import { structure_resume, StructuredResume } from "../../../../lib/resume/resumeParser";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper to truncate text to avoid token limits
function truncateText(text: string, maxLength: number = 8000): string {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const jobDescription = formData.get("job_description") as string;
  const questionCount = parseInt(formData.get("question_count") as string) || 5;
  const resumeFile = formData.get("resume_file") as File | null;

  let resumeData: StructuredResume | null = null;
  
  if (resumeFile) {
    try {
      // Convert File to text
      const text = await resumeFile.text();
      // Truncate resume if too large to avoid token limit errors
      const truncatedText = truncateText(text);
      // Use the existing structure_resume function
      resumeData = await structure_resume(truncatedText);
    } catch (error) {
      console.error("Error parsing resume:", error);
    }
  }

  // Get job requirements using the existing function
  const jobRequirements = await extract_job_requirements(jobDescription);

  let prompt = "";
  if (resumeData) {
    prompt = `Create a set of interview questions for a candidate applying to this job.

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
  } else {
    prompt = `Create a set of interview questions for candidates applying to this job.

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

  try {
    // Use GPT-4 which supports JSON response format
    const model = "gpt-4o-mini";
    
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: "You are an expert interviewer who creates tailored interview questions based on job descriptions and candidate profiles." },
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
    
    const questions = JSON.parse(content);
    return NextResponse.json({
      questions,
      metadata: {
        job_analyzed: true,
        resume_analyzed: !!resumeData,
        question_count: questionCount,
        categories: Object.keys(questions).length
      }
    });
  } catch (err) {
    console.error("Error generating interview questions:", err);
    return NextResponse.json({
      error: "Failed to parse interview questions",
      message: "The service encountered an error generating interview questions."
    }, { status: 500 });
  }
} 