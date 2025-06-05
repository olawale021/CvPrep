import { NextRequest } from 'next/server'

// Mock file creation helper
export function createMockFile(content: string, type: string = 'text/plain', filename: string = 'test.txt'): File {
  const blob = new Blob([content], { type })
  const file = new File([blob], filename, { type })
  
  // Add arrayBuffer method for Node.js environment
  if (!file.arrayBuffer) {
    file.arrayBuffer = async () => {
      const buffer = Buffer.from(content)
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    }
  }
  
  return file
}

// Mock PDF file for testing
export function createMockPDFFile(): File {
  const content = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Resume Content) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000074 00000 n 
0000000120 00000 n 
0000000179 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
274
%%EOF`
  
  return createMockFile(content, 'application/pdf', 'resume.pdf')
}

// Mock DOCX file
export function createMockDocxFile(): File {
  return createMockFile('Test resume content in DOCX format', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'resume.docx')
}

// Create FormData with file
export function createFormDataWithFile(file: File, additionalFields: Record<string, string> = {}): FormData {
  const formData = new FormData()
  formData.append('file', file)
  
  // Map common field names to what the API expects
  Object.entries(additionalFields).forEach(([key, value]) => {
    if (key === 'jobDescription') {
      formData.append('job', value) // API expects 'job' field
    } else {
      formData.append(key, value)
    }
  })
  
  return formData
}

// Create NextRequest with FormData
export function createNextRequestWithFormData(
  formData: FormData, 
  url: string = 'http://localhost:3000/api/test',
  method: string = 'POST'
): NextRequest {
  // Create a mock request object that mimics NextRequest behavior
  return {
    url,
    method,
    headers: new Map(),
    formData: async () => formData,
    json: async () => ({}),
    text: async () => '',
    body: formData
  } as unknown as NextRequest
}

// Mock OpenAI response helper
export function createMockOpenAIResponse(content: string | Record<string, unknown>) {
  return {
    choices: [{
      message: {
        content: typeof content === 'string' ? content : JSON.stringify(content)
      }
    }]
  }
}

// Sample resume text for testing
export const SAMPLE_RESUME_TEXT = `
John Doe
Software Engineer
john.doe@email.com | (555) 123-4567 | LinkedIn: john-doe

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years of experience in full-stack development, 
specializing in React, Node.js, and cloud technologies.

WORK EXPERIENCE

Senior Software Engineer | Tech Corp | 2021-Present
• Developed and maintained web applications using React and Node.js
• Led a team of 4 developers to deliver projects on time
• Improved application performance by 40% through optimization
• Implemented CI/CD pipelines using Docker and AWS

Software Engineer | StartupXYZ | 2019-2021
• Built REST APIs using Node.js and Express
• Worked with MongoDB and PostgreSQL databases
• Collaborated with design team to implement responsive UIs
• Reduced bug reports by 30% through comprehensive testing

TECHNICAL SKILLS
• Languages: JavaScript, TypeScript, Python, Java
• Frontend: React, Vue.js, HTML5, CSS3, Tailwind CSS
• Backend: Node.js, Express, Django, Spring Boot
• Databases: MongoDB, PostgreSQL, MySQL
• Cloud: AWS, Azure, Docker, Kubernetes
• Tools: Git, Jenkins, Jira, Figma

EDUCATION
Bachelor of Science in Computer Science
University of Technology | 2015-2019

CERTIFICATIONS
• AWS Certified Solutions Architect
• Google Cloud Professional Developer
`

// Sample job description for testing
export const SAMPLE_JOB_DESCRIPTION = `
Senior Full Stack Developer - Remote

We are looking for an experienced Full Stack Developer to join our growing team. 
The ideal candidate will have strong experience with modern web technologies and cloud platforms.

Key Responsibilities:
• Develop and maintain web applications using React and Node.js
• Design and implement RESTful APIs
• Work with databases (PostgreSQL, MongoDB)
• Deploy and manage applications on AWS
• Collaborate with cross-functional teams
• Write clean, maintainable code with proper testing

Requirements:
• 3+ years of experience in full-stack development
• Strong proficiency in JavaScript/TypeScript
• Experience with React and Node.js
• Knowledge of database design and optimization
• Experience with cloud platforms (AWS preferred)
• Strong problem-solving skills
• Bachelor's degree in Computer Science or related field

Nice to have:
• Experience with Docker and Kubernetes
• Knowledge of CI/CD pipelines
• Experience with Agile methodologies
• Previous startup experience
`

// Test timeout helper
export const TEST_TIMEOUT = 10000

// Mock successful API responses
export const MOCK_RESPONSES = {
  optimizeResume: {
    optimized_text: "Optimized resume content...",
    note: "Resume optimization completed successfully",
    summary: "Software Engineer with 5+ years of experience...",
    work_experience: [
      {
        company: "Test Company",
        title: "Senior Developer",
        dates: "2020-Present",
        achievements: ["Improved system performance by 30%", "Led team of 5 developers"]
      }
    ],
    skills: {
      technical_skills: ["JavaScript", "React", "Node.js"],
      soft_skills: ["Leadership", "Communication", "Problem Solving"]
    }
  },
  scoreResume: {
    overall_score: 85,
    section_scores: {
      summary: 90,
      experience: 80,
      skills: 85,
      education: 75
    },
    feedback: {
      strengths: ["Strong technical skills", "Relevant experience"],
      improvements: ["Add more quantifiable achievements", "Expand on leadership experience"]
    },
    recommendations: ["Consider adding more metrics to achievements"]
  },
  analyzeResume: {
    strengths: ["Strong technical background", "Relevant work experience"],
    weaknesses: ["Limited leadership examples", "Missing certifications"],
    suggestions: ["Add more quantifiable results", "Include relevant certifications"],
    overall_rating: "Good",
    score: 78
  },
  addExperience: {
    success: true,
    message: 'Work experience added successfully',
    addedExperience: {
      company: "Test Company",
      role: "Test Role",
      date_range: "Present",
      accomplishments: ["Achievement 1", "Achievement 2"]
    }
  }
} 