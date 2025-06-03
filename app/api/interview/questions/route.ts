import { NextRequest, NextResponse } from "next/server";
import { generateInterviewQuestions } from "../../../../lib/interview/interviewService";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const jobDescription = formData.get("job_description") as string;
    const questionCount = parseInt(formData.get("question_count") as string) || 5;
    const resumeFile = formData.get("resume_file") as File | null;

    // Validate required fields
    if (!jobDescription || jobDescription.trim().length === 0) {
      return NextResponse.json({
        error: "Job description is required",
        message: "Please provide a job description to generate interview questions."
      }, { status: 400 });
    }

    // Generate interview questions using the service
    const result = await generateInterviewQuestions(
      jobDescription.trim(),
      questionCount,
      resumeFile
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in interview questions API:", error);
    return NextResponse.json({
      error: "Internal server error",
      message: "The service encountered an error generating interview questions."
    }, { status: 500 });
  }
} 