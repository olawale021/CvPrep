import OpenAI from 'openai';

const openaiApiKey = process.env.OPENAI_API_KEY;
let openai: OpenAI | null = null;
if (openaiApiKey) {
  openai = new OpenAI({ apiKey: openaiApiKey });
}

export interface ContactDetails {
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  location?: string;
  [key: string]: string | undefined;
}

const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const phoneRegex = /\+?\d[\d\s\-()]{7,}\d/;
const linkedinRegex = /linkedin\.com\/[a-zA-Z0-9\-_/]+/i;
const githubRegex = /github\.com\/[a-zA-Z0-9\-_/]+/i;

export async function extractContactDetails(resumeText: string): Promise<ContactDetails> {
  const details: ContactDetails = {};
  const lines = resumeText.split(/\r?\n/);

  // Name (first non-empty line, if it looks like a name)
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && /^[A-Z][a-z]+(\s+[A-Z][a-z]+)+$/.test(trimmed)) {
      details.name = trimmed;
      break;
    }
  }

  // Email
  const emailMatch = resumeText.match(emailRegex);
  if (emailMatch) details.email = emailMatch[0];

  // Phone
  const phoneMatch = resumeText.match(phoneRegex);
  if (phoneMatch) details.phone = phoneMatch[0];

  // LinkedIn
  const linkedinMatch = resumeText.match(linkedinRegex);
  if (linkedinMatch) details.linkedin = linkedinMatch[0];

  // GitHub
  const githubMatch = resumeText.match(githubRegex);
  if (githubMatch) details.github = githubMatch[0];

  // Try to extract location from first few lines with city name pattern
  const firstFewLines = lines.slice(0, 10).join(' ');
  const locationMatches = firstFewLines.match(/\b(Birmingham|London|Manchester|Leeds|Liverpool|Glasgow|Edinburgh|Bristol|Cardiff|Belfast|[A-Z][a-z]+)\b/g);
  if (locationMatches && locationMatches.length > 0) {
    // Filter out matches that are likely not locations (like "SUMMARY", "EXPERIENCE", etc.)
    const validLocations = locationMatches.filter(loc => 
      !['SUMMARY', 'EXPERIENCE', 'EDUCATION', 'SKILLS', 'PROFILE', 'OBJECTIVE'].includes(loc.toUpperCase())
    );
    if (validLocations.length > 0) {
      details.location = validLocations[0];
    }
  }

  // If not enough details, fallback to OpenAI
  if (openai && (Object.keys(details).length < 3 || !details.location)) {
    try {
      const prompt = `Extract the following contact details from this resume: name, email, phone, LinkedIn, GitHub, location. Return a JSON object with these keys.\n\nResume:\n${resumeText}`;
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a resume contact extractor.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
      });
      const content = response.choices[0].message.content || '';
      const json = JSON.parse(content.replace(/```json|```/g, '').trim());
      return json;
    } catch (error: unknown) {
      // Just log the error and fallback to regex result
      console.error("OpenAI contact extraction failed:", error instanceof Error ? error.message : String(error));
    }
  }
  return details;
} 