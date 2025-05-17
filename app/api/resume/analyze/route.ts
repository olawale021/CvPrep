import { NextRequest, NextResponse } from 'next/server';
import { extractContactDetails } from '../../../../lib/resume/extractContactDetails';
import { extractTextFromFile } from '../../../../lib/resume/fileParser';
import { segment_resume_sections, structure_resume } from '../../../../lib/resume/resumeParser';

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
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimetype = file.type;
    const text = await extractTextFromFile(buffer, mimetype);
    const structured_resume = await structure_resume(text);
    const contact_details = await extractContactDetails(text);
    const segments = await segment_resume_sections(text);
    return NextResponse.json({ text, structured_resume, contact_details, segments });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
} 