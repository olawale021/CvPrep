import { POST } from '../../../app/api/interview/simulate/route'
import {
    createNextRequestWithFormData,
    SAMPLE_JOB_DESCRIPTION,
    TEST_TIMEOUT
} from '../../utils/test-helpers'

// Mock the simulation service
jest.mock('../../../lib/interview/simulationService', () => ({
  simulateInterview: jest.fn()
}))

import { simulateInterview } from '../../../lib/interview/simulationService'

// Mock responses for testing
const MOCK_SIMULATION_FEEDBACK = {
  answer_feedback: [
    {
      question: "Tell me about your experience with React",
      strengths: ["Shows good understanding of React fundamentals", "Mentions practical experience"],
      improvements: ["Could provide more specific examples", "Should mention advanced React concepts"],
      score: 7,
      better_answer: "I have 3+ years of experience with React, building complex SPAs. For example, I recently developed a e-commerce platform where I implemented custom hooks for state management and optimized rendering performance using React.memo and useMemo, resulting in 40% faster load times."
    },
    {
      question: "How do you handle debugging complex issues?",
      strengths: ["Mentions systematic approach", "Shows problem-solving mindset"],
      improvements: ["Could describe specific debugging tools", "Should mention collaboration techniques"],
      score: 6,
      better_answer: "I follow a systematic debugging approach: first, I reproduce the issue locally, then use browser dev tools and logging to trace the problem. I leverage tools like React DevTools, Redux DevTools, and Chrome Performance tab. When stuck, I collaborate with team members and document findings for future reference."
    }
  ],
  overall_evaluation: {
    score: 7,
    strengths: ["Strong technical foundation", "Good communication skills", "Shows enthusiasm for the role"],
    improvements: ["Provide more quantifiable achievements", "Include more specific technical examples", "Demonstrate deeper knowledge of advanced concepts"],
    recommendation: "Good candidate with solid fundamentals. Recommend additional technical deep-dive to assess advanced skills. Consider for next round of interviews."
  }
}

const SAMPLE_QUESTIONS = [
  "Tell me about your experience with React",
  "How do you handle debugging complex issues?",
  "Describe a challenging project you worked on"
]

const SAMPLE_ANSWERS = [
  "I have been working with React for over 2 years and built several web applications",
  "I usually start by checking the console for errors and then use debugging tools",
  "I worked on a large e-commerce platform that required complex state management"
]

describe('/api/interview/simulate', () => {
  const mockSimulateInterview = simulateInterview as jest.MockedFunction<typeof simulateInterview>

  beforeEach(() => {
    mockSimulateInterview.mockClear()
    
    // Set up default successful mock
    mockSimulateInterview.mockResolvedValue(MOCK_SIMULATION_FEEDBACK)
  })

  describe('POST /api/interview/simulate', () => {
    it('should simulate interview with valid data', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      SAMPLE_QUESTIONS.forEach(q => formData.append('questions', q))
      SAMPLE_ANSWERS.forEach(a => formData.append('answers', a))
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result).toEqual(MOCK_SIMULATION_FEEDBACK)
      expect(mockSimulateInterview).toHaveBeenCalledWith(
        SAMPLE_JOB_DESCRIPTION.trim(),
        SAMPLE_QUESTIONS,
        SAMPLE_ANSWERS
      )
    }, TEST_TIMEOUT)

    it('should handle missing job description', async () => {
      // Arrange
      const formData = new FormData()
      SAMPLE_QUESTIONS.forEach(q => formData.append('questions', q))
      SAMPLE_ANSWERS.forEach(a => formData.append('answers', a))
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.error).toBe('Job description is required')
      expect(result.message).toBe('Please provide a job description for interview evaluation.')
      expect(mockSimulateInterview).not.toHaveBeenCalled()
    })

    it('should handle empty job description', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('job_description', '   ')
      SAMPLE_QUESTIONS.forEach(q => formData.append('questions', q))
      SAMPLE_ANSWERS.forEach(a => formData.append('answers', a))
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.error).toBe('Job description is required')
      expect(result.message).toBe('Please provide a job description for interview evaluation.')
      expect(mockSimulateInterview).not.toHaveBeenCalled()
    })

    it('should handle missing questions', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      SAMPLE_ANSWERS.forEach(a => formData.append('answers', a))
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.error).toBe('Questions and answers are required')
      expect(result.message).toBe('Please provide both questions and answers for evaluation.')
      expect(mockSimulateInterview).not.toHaveBeenCalled()
    })

    it('should handle missing answers', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      SAMPLE_QUESTIONS.forEach(q => formData.append('questions', q))
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.error).toBe('Questions and answers are required')
      expect(result.message).toBe('Please provide both questions and answers for evaluation.')
      expect(mockSimulateInterview).not.toHaveBeenCalled()
    })

    it('should handle question-answer count mismatch', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      SAMPLE_QUESTIONS.forEach(q => formData.append('questions', q))
      // Only add 2 answers for 3 questions
      formData.append('answers', SAMPLE_ANSWERS[0])
      formData.append('answers', SAMPLE_ANSWERS[1])
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.error).toBe('Question and answer count mismatch')
      expect(result.message).toBe('The number of questions and answers must match.')
      expect(mockSimulateInterview).not.toHaveBeenCalled()
    })

    it('should filter out empty questions and answers', async () => {
      // Arrange
      const questionsWithEmpty = [...SAMPLE_QUESTIONS, '', '  ']
      const answersWithEmpty = [...SAMPLE_ANSWERS, '', '  ']
      
      const formData = new FormData()
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      questionsWithEmpty.forEach(q => formData.append('questions', q))
      answersWithEmpty.forEach(a => formData.append('answers', a))
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockSimulateInterview).toHaveBeenCalledWith(
        SAMPLE_JOB_DESCRIPTION.trim(),
        SAMPLE_QUESTIONS, // empty strings filtered out
        SAMPLE_ANSWERS    // empty strings filtered out
      )
    })

    it('should handle service errors', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      SAMPLE_QUESTIONS.forEach(q => formData.append('questions', q))
      SAMPLE_ANSWERS.forEach(a => formData.append('answers', a))
      const request = createNextRequestWithFormData(formData)

      const errorMessage = 'Failed to simulate interview'
      mockSimulateInterview.mockRejectedValue(new Error(errorMessage))

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(result.error).toBe('Internal server error')
      expect(result.message).toBe('The service encountered an error evaluating the interview answers.')
    })

    it('should handle single question-answer pair', async () => {
      // Arrange
      const singleQuestion = [SAMPLE_QUESTIONS[0]]
      const singleAnswer = [SAMPLE_ANSWERS[0]]
      
      const formData = new FormData()
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      formData.append('questions', singleQuestion[0])
      formData.append('answers', singleAnswer[0])
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockSimulateInterview).toHaveBeenCalledWith(
        SAMPLE_JOB_DESCRIPTION.trim(),
        singleQuestion,
        singleAnswer
      )
    })

    it('should handle many question-answer pairs', async () => {
      // Arrange
      const manyQuestions = Array.from({ length: 20 }, (_, i) => `Question ${i + 1}`)
      const manyAnswers = Array.from({ length: 20 }, (_, i) => `Answer ${i + 1}`)
      
      const formData = new FormData()
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      manyQuestions.forEach(q => formData.append('questions', q))
      manyAnswers.forEach(a => formData.append('answers', a))
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockSimulateInterview).toHaveBeenCalledWith(
        SAMPLE_JOB_DESCRIPTION.trim(),
        manyQuestions,
        manyAnswers
      )
    }, TEST_TIMEOUT)

    it('should trim whitespace from job description', async () => {
      // Arrange
      const jobWithWhitespace = `  ${SAMPLE_JOB_DESCRIPTION}  `
      const formData = new FormData()
      formData.append('job_description', jobWithWhitespace)
      SAMPLE_QUESTIONS.forEach(q => formData.append('questions', q))
      SAMPLE_ANSWERS.forEach(a => formData.append('answers', a))
      const request = createNextRequestWithFormData(formData)

      // Act
      await POST(request)

      // Assert
      expect(mockSimulateInterview).toHaveBeenCalledWith(
        SAMPLE_JOB_DESCRIPTION.trim(),
        SAMPLE_QUESTIONS,
        SAMPLE_ANSWERS
      )
    })

    it('should handle very long questions and answers', async () => {
      // Arrange
      const longQuestions = Array.from({ length: 3 }, (_, i) => 'x'.repeat(5000) + ` Question ${i}`)
      const longAnswers = Array.from({ length: 3 }, (_, i) => 'y'.repeat(5000) + ` Answer ${i}`)
      
      const formData = new FormData()
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      longQuestions.forEach(q => formData.append('questions', q))
      longAnswers.forEach(a => formData.append('answers', a))
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockSimulateInterview).toHaveBeenCalledWith(
        SAMPLE_JOB_DESCRIPTION.trim(),
        longQuestions,
        longAnswers
      )
    }, TEST_TIMEOUT)

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
      expect(mockSimulateInterview).not.toHaveBeenCalled()
    })

    it('should handle service returning null', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      SAMPLE_QUESTIONS.forEach(q => formData.append('questions', q))
      SAMPLE_ANSWERS.forEach(a => formData.append('answers', a))
      const request = createNextRequestWithFormData(formData)

      mockSimulateInterview.mockResolvedValue(null as any)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result).toBe(null)
    })

    it('should handle questions with special characters', async () => {
      // Arrange
      const specialQuestions = [
        "What's your experience with React & Node.js?",
        "How do you handle \"edge cases\" in code?",
        "Explain async/await vs promises"
      ]
      const specialAnswers = [
        "I've worked with React & Node.js for 2+ years",
        "I use try-catch blocks and \"defensive programming\"",
        "Async/await makes asynchronous code more readable than promises"
      ]
      
      const formData = new FormData()
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      specialQuestions.forEach(q => formData.append('questions', q))
      specialAnswers.forEach(a => formData.append('answers', a))
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockSimulateInterview).toHaveBeenCalledWith(
        SAMPLE_JOB_DESCRIPTION.trim(),
        specialQuestions,
        specialAnswers
      )
    })

    it('should handle empty arrays after filtering', async () => {
      // Arrange - all empty questions and answers
      const emptyQuestions = ['', '  ', '\t']
      const emptyAnswers = ['', '  ', '\t']
      
      const formData = new FormData()
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      emptyQuestions.forEach(q => formData.append('questions', q))
      emptyAnswers.forEach(a => formData.append('answers', a))
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockSimulateInterview).toHaveBeenCalledWith(
        SAMPLE_JOB_DESCRIPTION.trim(),
        [], // all filtered out
        []  // all filtered out
      )
    })
  })
}) 