import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

export async function extractTextFromFile(file: Buffer, mimetype: string): Promise<string> {
  if (mimetype === 'application/pdf') {
    try {
      // Pass the file buffer directly to pdf-parse
      const data = await pdfParse(file);
      return data.text;
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF file');
    }
  }
  
  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword'
  ) {
    const { value } = await mammoth.extractRawText({ buffer: file });
    return value;
  }
  
  if (mimetype === 'text/plain') {
    // For plain text files, just convert the buffer to string
    return file.toString('utf-8');
  }
  
  throw new Error('Unsupported file type');
} 