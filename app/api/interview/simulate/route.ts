import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { extract_job_requirements } from "../../../../lib/resume/jobParser";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const jobDescription = formData.get("job_description") as string;
  const questions = formData.getAll("questions").map(String);
  const answers = formData.getAll("answers").map(String);

  if (questions.length !== answers.length) {
    return NextResponse.json({
      error: "Question and answer count mismatch",
      message: "The number of questions and answers must match."
    }, { status: 400 });
  }

  const jobRequirements = await extract_job_requirements(jobDescription);

  const qaPairs = questions.map((q, i) => ({ question: q, answer: answers[i] }));

  const prompt = `Evaluate these interview answers for the specified job.\n\nJob Description:\n${jobDescription}\n\nJob Requirements:\n${JSON.stringify(jobRequirements, null, 2)}\n\nQuestion-Answer Pairs:\n${JSON.stringify(qaPairs, null, 2)}\n\nFor each answer, provide:\n1. Strengths (what was good)\n2. Areas for improvement\n3. Score (1-10)\n4. Suggested better answer\n\nAlso provide an overall evaluation with:\n1. Overall score (1-10)\n2. General strengths\n3. General improvement areas\n4. Final recommendation\n\nReturn as JSON with:\n- answer_feedback (array of objects with question, strengths, improvements, score, better_answer)\n- overall_evaluation (object with score, strengths, improvements, recommendation)`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.GPT_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert interviewer who provides constructive feedback on interview answers." },
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
    
    const feedback = JSON.parse(content);
    return NextResponse.json(feedback);
  } catch (err) {
    console.error("Error generating interview feedback:", err);
    return NextResponse.json({
      error: "Failed to generate interview feedback",
      message: "The service encountered an error evaluating the interview answers."
    }, { status: 500 });
  }
} 