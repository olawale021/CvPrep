import { NextRequest, NextResponse } from "next/server";
import { withFeatureLimit } from "../../../../lib/auth/userRateLimit";
import { generateAnswerTips } from "../../../../lib/services/interview/answerTipsService";

export async function POST(req: NextRequest) {
  return withFeatureLimit(req, 'interview_prep', async () => {
    try {
      const formData = await req.formData();
      const question = formData.get("question") as string;
      const jobDescription = formData.get("job_description") as string;

      // Validate required fields
      if (!question || question.trim().length === 0) {
        return NextResponse.json({
          error: "Question is required",
          message: "Please provide a question to get answer tips."
        }, { status: 400 });
      }

      // Generate answer tips using the service
      const result = await generateAnswerTips(
        question.trim(),
        jobDescription || 'General interview question'
      );

      return NextResponse.json(result);
    } catch (error) {
      console.error("Error in answer tips API:", error);
      return NextResponse.json({
        error: "Internal server error",
        message: "The service encountered an error generating answer tips."
      }, { status: 500 });
    }
  });
} 