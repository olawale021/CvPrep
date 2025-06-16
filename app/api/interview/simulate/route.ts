import { NextRequest, NextResponse } from "next/server";
import { simulateInterview } from "../../../../lib/services/interview/simulationService";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const jobDescription = formData.get("job_description") as string;
    const questions = formData.getAll("questions").map(String);
    const answers = formData.getAll("answers").map(String);

    // Validate required fields
    if (!jobDescription || jobDescription.trim().length === 0) {
      return NextResponse.json({
        error: "Job description is required",
        message: "Please provide a job description for interview evaluation."
      }, { status: 400 });
    }

    if (!questions.length || !answers.length) {
      return NextResponse.json({
        error: "Questions and answers are required",
        message: "Please provide both questions and answers for evaluation."
      }, { status: 400 });
    }

    if (questions.length !== answers.length) {
      return NextResponse.json({
        error: "Question and answer count mismatch",
        message: "The number of questions and answers must match."
      }, { status: 400 });
    }

    // Simulate interview using the service
    const feedback = await simulateInterview(
      jobDescription.trim(),
      questions.filter(q => q.trim().length > 0),
      answers.filter(a => a.trim().length > 0)
    );

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Error in interview simulation API:", error);
    return NextResponse.json({
      error: "Internal server error",
      message: "The service encountered an error evaluating the interview answers."
    }, { status: 500 });
  }
} 