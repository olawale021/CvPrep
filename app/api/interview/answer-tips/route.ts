import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const question = formData.get("question") as string;
  const jobDescription = formData.get("job_description") as string;

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

Return as JSON with these exact keys:
- answer_structure (array of steps)
- key_points (array)
- skills_to_emphasize (array)
- mistakes_to_avoid (array)
- example_answer (string)`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.GPT_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert interview coach who helps candidates prepare effective answers to interview questions." },
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
    
    const answer_tips = JSON.parse(content);
    return NextResponse.json({
      question,
      answer_tips
    });
  } catch (err) {
    console.error("Error generating answer tips:", err);
    return NextResponse.json({
      error: "Failed to generate answer tips",
      message: "The service encountered an error generating answer tips."
    }, { status: 500 });
  }
} 