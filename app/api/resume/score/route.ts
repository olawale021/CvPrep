import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromFile } from '../../../../lib/resume/fileParser';
import { scoreResume } from '../../../../lib/resume/scoreResume';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file uploaded');

    const job = formData.get('job') as string || '';
    if (!job) throw new Error('No job description provided');

    // useOpenAI setting is handled internally in scoreResume

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimetype = file.type;
    
    const text = await extractTextFromFile(buffer, mimetype);

    // Call scoreResume with just the required parameters
    const score = await scoreResume(text, job);

    return NextResponse.json(score);
  } catch (error: unknown) {
    console.error('SCORE API Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
} 