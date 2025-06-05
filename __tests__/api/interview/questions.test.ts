import { POST } from '../../../app/api/interview/questions/route'
import {
    createMockPDFFile,
    createNextRequestWithFormData,
    SAMPLE_JOB_DESCRIPTION,
    TEST_TIMEOUT
} from '../../utils/test-helpers'

// Mock the interview service
jest.mock('../../../lib/interview/interviewService', () => ({
  generateInterviewQuestions: jest.fn(),
  InterviewQuestionsResponse: {}
}))

// Mock the job parser
jest.mock('../../../lib/resume/jobParser', () => ({
  extract_job_requirements: jest.fn()
}))

import { generateInterviewQuestions } from '../../../lib/interview/interviewService'
import { extract_job_requirements } from '../../../lib/resume/jobParser'

// Mock responses for testing
const MOCK_INTERVIEW_RESPONSE = {
  questions: {
    technical_questions: [
      "Explain your experience with React and modern JavaScript frameworks",
      "How do you handle state management in complex applications?",
      "Describe your approach to API integration and error handling"
    ],
    behavioral_questions: [
      "Tell me about a time when you had to meet a tight deadline",
      "Describe a situation where you had to work with a difficult stakeholder",
      "How do you handle constructive feedback from peers?"
    ],
    situational_questions: [
      "How would you approach debugging a production issue?",
      "What would you do if requirements changed mid-project?",
      "How would you handle conflicting priorities from different stakeholders?"
    ],
    role_specific_questions: [
      "Why are you interested in this full-stack developer position?",
      "How do you stay updated with the latest web development trends?",
      "What aspects of full-stack development excite you most?"
    ],
    culture_fit_questions: [
      "What type of work environment helps you perform your best?",
      "How do you prefer to collaborate with cross-functional teams?",
      "What motivates you to produce high-quality work?"
    ]
  },
  metadata: {
    job_analyzed: true,
    resume_analyzed: true,
    question_count: 3,
    categories: 5
  }
}

const MOCK_JOB_REQUIREMENTS = {
  required_skills: ["JavaScript", "React", "Node.js"],
  preferred_skills: ["TypeScript", "AWS", "Docker"],
  experience_level: "Mid-level",
  education_requirements: ["Bachelor's degree in Computer Science or related field"],
  job_responsibilities: ["Develop web applications", "Collaborate with team", "Write clean code"]
}

describe('/api/interview/questions', () => {
  const mockGenerateInterviewQuestions = generateInterviewQuestions as jest.MockedFunction<typeof generateInterviewQuestions>
  const mockExtractJobRequirements = extract_job_requirements as jest.MockedFunction<typeof extract_job_requirements>

  beforeEach(() => {
    mockGenerateInterviewQuestions.mockClear()
    mockExtractJobRequirements.mockClear()
    
    // Set up default successful mocks
    mockGenerateInterviewQuestions.mockResolvedValue(MOCK_INTERVIEW_RESPONSE)
    mockExtractJobRequirements.mockResolvedValue(MOCK_JOB_REQUIREMENTS)
  })

  describe('POST /api/interview/questions', () => {
    it('should generate interview questions with valid job description', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      formData.append('question_count', '3')
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result).toEqual(MOCK_INTERVIEW_RESPONSE)
      expect(mockGenerateInterviewQuestions).toHaveBeenCalledWith(
        SAMPLE_JOB_DESCRIPTION.trim(),
        3,
        null
      )
    }, TEST_TIMEOUT)

    it('should generate questions with resume file included', async () => {
      // Arrange
      const resumeFile = createMockPDFFile()
      const formData = new FormData()
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      formData.append('question_count', '5')
      formData.append('resume_file', resumeFile)
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result).toEqual(MOCK_INTERVIEW_RESPONSE)
      expect(mockGenerateInterviewQuestions).toHaveBeenCalledWith(
        SAMPLE_JOB_DESCRIPTION.trim(),
        5,
        resumeFile
      )
    }, TEST_TIMEOUT)

    it('should use default question count when not provided', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockGenerateInterviewQuestions).toHaveBeenCalledWith(
        SAMPLE_JOB_DESCRIPTION.trim(),
        5, // default value
        null
      )
    })

    it('should handle missing job description', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('question_count', '3')
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.error).toBe('Job description is required')
      expect(result.message).toBe('Please provide a job description to generate interview questions.')
      expect(mockGenerateInterviewQuestions).not.toHaveBeenCalled()
    })

    it('should handle empty job description', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('job_description', '   ')
      formData.append('question_count', '3')
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.error).toBe('Job description is required')
      expect(result.message).toBe('Please provide a job description to generate interview questions.')
      expect(mockGenerateInterviewQuestions).not.toHaveBeenCalled()
    })

    it('should handle invalid question count', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      formData.append('question_count', 'invalid')
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockGenerateInterviewQuestions).toHaveBeenCalledWith(
        SAMPLE_JOB_DESCRIPTION.trim(),
        5, // defaults to 5 when parsing fails
        null
      )
    })

    it('should handle service errors', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      formData.append('question_count', '3')
      const request = createNextRequestWithFormData(formData)

      const errorMessage = 'Failed to generate interview questions'
      mockGenerateInterviewQuestions.mockRejectedValue(new Error(errorMessage))

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(result.error).toBe('Internal server error')
      expect(result.message).toBe('The service encountered an error generating interview questions.')
    })

    it('should handle large question counts', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      formData.append('question_count', '20')
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockGenerateInterviewQuestions).toHaveBeenCalledWith(
        SAMPLE_JOB_DESCRIPTION.trim(),
        20,
        null
      )
    })

    it('should trim whitespace from job description', async () => {
      // Arrange
      const jobWithWhitespace = `  ${SAMPLE_JOB_DESCRIPTION}  `
      const formData = new FormData()
      formData.append('job_description', jobWithWhitespace)
      formData.append('question_count', '3')
      const request = createNextRequestWithFormData(formData)

      // Act
      await POST(request)

      // Assert
      expect(mockGenerateInterviewQuestions).toHaveBeenCalledWith(
        SAMPLE_JOB_DESCRIPTION.trim(),
        3,
        null
      )
    })

    it('should handle malformed FormData', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('invalid_field', 'invalid_value')
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.error).toBe('Job description is required')
      expect(mockGenerateInterviewQuestions).not.toHaveBeenCalled()
    })

    it('should handle negative question counts', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      formData.append('question_count', '-5')
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockGenerateInterviewQuestions).toHaveBeenCalledWith(
        SAMPLE_JOB_DESCRIPTION.trim(),
        -5, // API doesn't validate negative numbers
        null
      )
    })

    it('should handle zero question count', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      formData.append('question_count', '0')
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockGenerateInterviewQuestions).toHaveBeenCalledWith(
        SAMPLE_JOB_DESCRIPTION.trim(),
        5, // 0 is falsy, so defaults to 5
        null
      )
    })

    it('should handle service returning null', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      formData.append('question_count', '3')
      const request = createNextRequestWithFormData(formData)

      mockGenerateInterviewQuestions.mockResolvedValue(null as unknown as typeof MOCK_INTERVIEW_RESPONSE)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result).toBe(null)
    })

    it('should handle very long job descriptions', async () => {
      // Arrange
      const longJobDescription = 'x'.repeat(50000) // 50KB job description
      const formData = new FormData()
      formData.append('job_description', longJobDescription)
      formData.append('question_count', '3')
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockGenerateInterviewQuestions).toHaveBeenCalledWith(
        longJobDescription.trim(),
        3,
        null
      )
    }, TEST_TIMEOUT)
  })
}) 