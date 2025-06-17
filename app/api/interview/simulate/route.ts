import { NextRequest, NextResponse } from "next/server";
import { withFeatureLimit } from "../../../../lib/auth/userRateLimit";
import { simulateInterview } from "../../../../lib/services/interview/simulationService";

export async function POST(req: NextRequest) {
  return withFeatureLimit(req, 'interview_prep', async () => {
    try {
      const body = await req.json();
      const { jobDescription, questions, answers } = body;

      // Validate required fields
      if (!jobDescription || jobDescription.trim().length === 0) {
        return NextResponse.json({
          error: "Job description is required",
          message: "Please provide a job description for interview evaluation."
        }, { status: 400 });
      }

      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return NextResponse.json({
          error: "Questions are required",
          message: "Please provide interview questions."
        }, { status: 400 });
      }

      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return NextResponse.json({
          error: "Answers are required",
          message: "Please provide your answers to evaluate."
        }, { status: 400 });
      }

      if (questions.length !== answers.length) {
        return NextResponse.json({
          error: "Question and answer count mismatch",
          message: "The number of questions and answers must match."
        }, { status: 400 });
      }

      // Simulate interview feedback using the service
      const result = await simulateInterview(
        jobDescription.trim(),
        questions.filter((q: string) => q.trim().length > 0),
        answers.filter((a: string) => a.trim().length > 0)
      );

      return NextResponse.json(result);
    } catch (error) {
      console.error("Error in interview simulation API:", error);
      return NextResponse.json({
        error: "Internal server error",
        message: "The service encountered an error simulating the interview."
      }, { status: 500 });
    }
  });
} 