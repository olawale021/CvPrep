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
    console.log('--- SCORE API: Processing request ---');
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file uploaded');
    console.log('SCORE API: File received:', file.name, file.type, file.size);
    
    const job = formData.get('job') as string || '';
    if (!job) throw new Error('No job description provided');
    console.log('SCORE API: Job description length:', job.length);
    
    // We get this from the form but don't actually use it since it's handled internally in scoreResume
    const useOpenAI = formData.get('useOpenAI') as string;
    console.log('SCORE API: useOpenAI setting:', useOpenAI);
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimetype = file.type;
    
    const text = await extractTextFromFile(buffer, mimetype);
    console.log('SCORE API: Extracted text length:', text.length);
    
    // Call scoreResume with just the required parameters
    const score = await scoreResume(text, job);
    console.log('SCORE API: Score result:', JSON.stringify(score, null, 2));
    
    return NextResponse.json(score);
  } catch (error: unknown) {
    console.error('SCORE API Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
} 