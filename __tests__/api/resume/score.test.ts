import { POST } from '../../../app/api/resume/score/route'
import {
    createFormDataWithFile,
    createMockPDFFile,
    createNextRequestWithFormData,
    MOCK_RESPONSES,
    SAMPLE_JOB_DESCRIPTION,
    TEST_TIMEOUT
} from '../../utils/test-helpers'

// Mock the score resume service
jest.mock('../../../lib/resume/scoreResume', () => ({
  scoreResume: jest.fn()
}))

import { scoreResume } from '../../../lib/resume/scoreResume'

describe('/api/resume/score', () => {
  const mockScoreResume = scoreResume as jest.MockedFunction<typeof scoreResume>

  beforeEach(() => {
    mockScoreResume.mockClear()
  })

  describe('POST /api/resume/score', () => {
    it('should score resume with valid file and job description', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile, {
        jobDescription: SAMPLE_JOB_DESCRIPTION
      })
      const request = createNextRequestWithFormData(formData, 'http://localhost:3000/api/resume/score')

      mockScoreResume.mockResolvedValue(MOCK_RESPONSES.scoreResume)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result).toEqual(MOCK_RESPONSES.scoreResume)
      expect(mockScoreResume).toHaveBeenCalledWith(
        expect.any(Buffer),
        'application/pdf',
        SAMPLE_JOB_DESCRIPTION
      )
    }, TEST_TIMEOUT)

    it('should handle missing file', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('jobDescription', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.error).toBe('No file uploaded')
      expect(mockScoreResume).not.toHaveBeenCalled()
    })

    it('should handle missing job description', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile)
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.error).toBe('Job description is required')
      expect(mockScoreResume).not.toHaveBeenCalled()
    })

    it('should handle empty job description', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile, {
        jobDescription: '   '
      })
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.error).toBe('Job description is required')
      expect(mockScoreResume).not.toHaveBeenCalled()
    })

    it('should handle score service errors', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile, {
        jobDescription: SAMPLE_JOB_DESCRIPTION
      })
      const request = createNextRequestWithFormData(formData)

      const errorMessage = 'Failed to score resume'
      mockScoreResume.mockRejectedValue(new Error(errorMessage))

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(result.error).toBe('Resume scoring failed')
      expect(result.message).toContain(errorMessage)
    })

    it('should validate score response structure', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile, {
        jobDescription: SAMPLE_JOB_DESCRIPTION
      })
      const request = createNextRequestWithFormData(formData)

      mockScoreResume.mockResolvedValue(MOCK_RESPONSES.scoreResume)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(result).toHaveProperty('overall_score')
      expect(result).toHaveProperty('section_scores')
      expect(result).toHaveProperty('feedback')
      expect(result).toHaveProperty('recommendations')
      
      expect(typeof result.overall_score).toBe('number')
      expect(result.overall_score).toBeGreaterThanOrEqual(0)
      expect(result.overall_score).toBeLessThanOrEqual(100)
      
      expect(result.section_scores).toHaveProperty('summary')
      expect(result.section_scores).toHaveProperty('experience')
      expect(result.section_scores).toHaveProperty('skills')
      expect(result.section_scores).toHaveProperty('education')
    })

    it('should handle different file types correctly', async () => {
      // Arrange
      const textFile = new File(['plain text resume'], 'resume.txt', { type: 'text/plain' })
      const formData = createFormDataWithFile(textFile, {
        jobDescription: SAMPLE_JOB_DESCRIPTION
      })
      const request = createNextRequestWithFormData(formData)

      mockScoreResume.mockResolvedValue(MOCK_RESPONSES.scoreResume)

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockScoreResume).toHaveBeenCalledWith(
        expect.any(Buffer),
        'text/plain',
        SAMPLE_JOB_DESCRIPTION
      )
    })

    it('should handle very short job descriptions', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const shortJobDescription = 'Developer needed'
      const formData = createFormDataWithFile(mockFile, {
        jobDescription: shortJobDescription
      })
      const request = createNextRequestWithFormData(formData)

      mockScoreResume.mockResolvedValue(MOCK_RESPONSES.scoreResume)

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockScoreResume).toHaveBeenCalledWith(
        expect.any(Buffer),
        'application/pdf',
        shortJobDescription
      )
    })

    it('should handle very long job descriptions', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const longJobDescription = 'A'.repeat(10000) // Very long description
      const formData = createFormDataWithFile(mockFile, {
        jobDescription: longJobDescription
      })
      const request = createNextRequestWithFormData(formData)

      mockScoreResume.mockResolvedValue(MOCK_RESPONSES.scoreResume)

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockScoreResume).toHaveBeenCalledWith(
        expect.any(Buffer),
        'application/pdf',
        longJobDescription
      )
    })

    it('should handle service returning invalid score data', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile, {
        jobDescription: SAMPLE_JOB_DESCRIPTION
      })
      const request = createNextRequestWithFormData(formData)

      const invalidScoreData = {
        overall_score: 'invalid', // Should be number
        section_scores: null,
        feedback: undefined
      }
      mockScoreResume.mockResolvedValue(invalidScoreData as any)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result).toEqual(invalidScoreData)
    })

    it('should trim whitespace from job description', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const jobDescriptionWithWhitespace = `  ${SAMPLE_JOB_DESCRIPTION}  `
      const formData = createFormDataWithFile(mockFile, {
        jobDescription: jobDescriptionWithWhitespace
      })
      const request = createNextRequestWithFormData(formData)

      mockScoreResume.mockResolvedValue(MOCK_RESPONSES.scoreResume)

      // Act
      await POST(request)

      // Assert
      expect(mockScoreResume).toHaveBeenCalledWith(
        expect.any(Buffer),
        'application/pdf',
        SAMPLE_JOB_DESCRIPTION.trim()
      )
    })

    it('should handle service timeout', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile, {
        jobDescription: SAMPLE_JOB_DESCRIPTION
      })
      const request = createNextRequestWithFormData(formData)

      mockScoreResume.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      )

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(result.error).toBe('Resume scoring failed')
    })

    it('should handle zero-byte files', async () => {
      // Arrange
      const emptyFile = new File([], 'empty.pdf', { type: 'application/pdf' })
      const formData = createFormDataWithFile(emptyFile, {
        jobDescription: SAMPLE_JOB_DESCRIPTION
      })
      const request = createNextRequestWithFormData(formData)

      mockScoreResume.mockResolvedValue(MOCK_RESPONSES.scoreResume)

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockScoreResume).toHaveBeenCalledWith(
        expect.any(Buffer),
        'application/pdf',
        SAMPLE_JOB_DESCRIPTION
      )
    })
  })
}) 