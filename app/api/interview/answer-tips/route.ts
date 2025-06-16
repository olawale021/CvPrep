import { NextRequest, NextResponse } from "next/server";
import { generateAnswerTips } from "../../../../lib/services/interview/answerTipsService";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const question = formData.get("question") as string;
    const jobDescription = formData.get("job_description") as string;

    // Validate required fields
    if (!question || question.trim().length === 0) {
      return NextResponse.json({
        error: "Question is required",
        message: "Please provide an interview question to get guidance for."
      }, { status: 400 });
    }

    if (!jobDescription || jobDescription.trim().length === 0) {
      return NextResponse.json({
        error: "Job description is required",
        message: "Please provide a job description to tailor the answer guidance."
      }, { status: 400 });
    }

    // Generate answer tips using the service
    const result = await generateAnswerTips(question.trim(), jobDescription.trim());

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in answer tips API:", error);
    return NextResponse.json({
      error: "Internal server error",
      message: "The service encountered an error generating answer tips."
    }, { status: 500 });
  }
} 