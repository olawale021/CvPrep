import { POST } from '../../../app/api/resume/add-experience/route'
import {
    createFormDataWithFile,
    createMockPDFFile,
    createNextRequestWithFormData,
    MOCK_RESPONSES,
    TEST_TIMEOUT
} from '../../utils/test-helpers'

// Mock the add experience service
jest.mock('../../../lib/resume/addExperienceService', () => ({
  addWorkExperience: jest.fn()
}))

import { addWorkExperience } from '../../../lib/resume/addExperienceService'

describe('/api/resume/add-experience', () => {
  const mockAddWorkExperience = addWorkExperience as jest.MockedFunction<typeof addWorkExperience>

  beforeEach(() => {
    mockAddWorkExperience.mockClear()
  })

  describe('POST /api/resume/add-experience', () => {
    it('should add work experience with valid data', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile, {
        jobTitle: 'Senior Software Engineer',
        company: 'Tech Corp',
        achievements: 'Led team of 5 developers\nImproved performance by 30%'
      })
      const request = createNextRequestWithFormData(formData, 'http://localhost:3000/api/resume/add-experience')

      mockAddWorkExperience.mockResolvedValue(MOCK_RESPONSES.addExperience)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result).toEqual(MOCK_RESPONSES.addExperience)
      expect(mockAddWorkExperience).toHaveBeenCalledWith(
        expect.any(File),
        'Senior Software Engineer',
        'Tech Corp',
        'Led team of 5 developers\nImproved performance by 30%'
      )
    }, TEST_TIMEOUT)

    it('should handle missing file', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('jobTitle', 'Senior Software Engineer')
      formData.append('company', 'Tech Corp')
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error).toBe('No resume file uploaded')
      expect(mockAddWorkExperience).not.toHaveBeenCalled()
    })

    it('should handle missing job title', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile, {
        company: 'Tech Corp'
      })
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Job title and company are required')
      expect(mockAddWorkExperience).not.toHaveBeenCalled()
    })

    it('should handle missing company', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile, {
        jobTitle: 'Senior Software Engineer'
      })
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Job title and company are required')
      expect(mockAddWorkExperience).not.toHaveBeenCalled()
    })

    it('should handle empty job title', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile, {
        jobTitle: '   ',
        company: 'Tech Corp'
      })
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Job title and company are required')
      expect(mockAddWorkExperience).not.toHaveBeenCalled()
    })

    it('should handle empty company', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile, {
        jobTitle: 'Senior Software Engineer',
        company: '   '
      })
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Job title and company are required')
      expect(mockAddWorkExperience).not.toHaveBeenCalled()
    })

    it('should work without achievements field', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile, {
        jobTitle: 'Software Engineer',
        company: 'Startup Inc'
      })
      const request = createNextRequestWithFormData(formData)

      mockAddWorkExperience.mockResolvedValue(MOCK_RESPONSES.addExperience)

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockAddWorkExperience).toHaveBeenCalledWith(
        expect.any(File),
        'Software Engineer',
        'Startup Inc',
        undefined
      )
    })

    it('should trim whitespace from inputs', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile, {
        jobTitle: '  Senior Software Engineer  ',
        company: '  Tech Corp  ',
        achievements: '  Led team of developers  '
      })
      const request = createNextRequestWithFormData(formData)

      mockAddWorkExperience.mockResolvedValue(MOCK_RESPONSES.addExperience)

      // Act
      await POST(request)

      // Assert
      expect(mockAddWorkExperience).toHaveBeenCalledWith(
        expect.any(File),
        'Senior Software Engineer',
        'Tech Corp',
        'Led team of developers'
      )
    })

    it('should handle service errors', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile, {
        jobTitle: 'Senior Software Engineer',
        company: 'Tech Corp'
      })
      const request = createNextRequestWithFormData(formData)

      const errorMessage = 'Failed to add work experience'
      mockAddWorkExperience.mockRejectedValue(new Error(errorMessage))

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(result.success).toBe(false)
      expect(result.error).toBe(errorMessage)
    })

    it('should handle service returning success false', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile, {
        jobTitle: 'Senior Software Engineer',
        company: 'Tech Corp'
      })
      const request = createNextRequestWithFormData(formData)

      const failureResponse = {
        success: false,
        message: 'Failed to process resume',
        updatedResume: null,
        addedExperience: {
          company: 'Tech Corp',
          role: 'Senior Software Engineer',
          date_range: 'Present',
          accomplishments: []
        }
      }
      mockAddWorkExperience.mockResolvedValue(failureResponse as any)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result).toEqual(failureResponse)
    })

    it('should handle different file types', async () => {
      // Arrange
      const docxFile = new File(['content'], 'resume.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      })
      const formData = createFormDataWithFile(docxFile, {
        jobTitle: 'Software Engineer',
        company: 'Tech Corp'
      })
      const request = createNextRequestWithFormData(formData)

      mockAddWorkExperience.mockResolvedValue(MOCK_RESPONSES.addExperience)

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockAddWorkExperience).toHaveBeenCalledWith(
        expect.any(File),
        'Software Engineer',
        'Tech Corp',
        undefined
      )
    })

    it('should handle very long job titles and company names', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const longJobTitle = 'A'.repeat(200)
      const longCompanyName = 'B'.repeat(200)
      const formData = createFormDataWithFile(mockFile, {
        jobTitle: longJobTitle,
        company: longCompanyName
      })
      const request = createNextRequestWithFormData(formData)

      mockAddWorkExperience.mockResolvedValue(MOCK_RESPONSES.addExperience)

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockAddWorkExperience).toHaveBeenCalledWith(
        expect.any(File),
        longJobTitle,
        longCompanyName,
        undefined
      )
    })

    it('should handle special characters in inputs', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const jobTitleWithSpecialChars = 'Senior Software Engineer/Architect'
      const companyWithSpecialChars = 'Tech Corp & Associates'
      const achievementsWithSpecialChars = 'Led team of 5+ developers\n• Improved performance by 30%\n• Reduced costs by $50,000'
      
      const formData = createFormDataWithFile(mockFile, {
        jobTitle: jobTitleWithSpecialChars,
        company: companyWithSpecialChars,
        achievements: achievementsWithSpecialChars
      })
      const request = createNextRequestWithFormData(formData)

      mockAddWorkExperience.mockResolvedValue(MOCK_RESPONSES.addExperience)

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockAddWorkExperience).toHaveBeenCalledWith(
        expect.any(File),
        jobTitleWithSpecialChars,
        companyWithSpecialChars,
        achievementsWithSpecialChars
      )
    })

    it('should handle large achievement text', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const largeAchievements = 'A'.repeat(10000) // Very long achievements
      const formData = createFormDataWithFile(mockFile, {
        jobTitle: 'Senior Software Engineer',
        company: 'Tech Corp',
        achievements: largeAchievements
      })
      const request = createNextRequestWithFormData(formData)

      mockAddWorkExperience.mockResolvedValue(MOCK_RESPONSES.addExperience)

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockAddWorkExperience).toHaveBeenCalledWith(
        expect.any(File),
        'Senior Software Engineer',
        'Tech Corp',
        largeAchievements
      )
    })

    it('should handle empty achievements field', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile, {
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        achievements: '   '
      })
      const request = createNextRequestWithFormData(formData)

      mockAddWorkExperience.mockResolvedValue(MOCK_RESPONSES.addExperience)

      // Act
      await POST(request)

      // Assert
      expect(mockAddWorkExperience).toHaveBeenCalledWith(
        expect.any(File),
        'Software Engineer',
        'Tech Corp',
        ''
      )
    })

    it('should validate response structure on success', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile, {
        jobTitle: 'Senior Software Engineer',
        company: 'Tech Corp'
      })
      const request = createNextRequestWithFormData(formData)

      mockAddWorkExperience.mockResolvedValue(MOCK_RESPONSES.addExperience)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result).toHaveProperty('success', true)
      expect(result).toHaveProperty('message')
      expect(result).toHaveProperty('addedExperience')
      expect(result.addedExperience).toHaveProperty('company')
      expect(result.addedExperience).toHaveProperty('role')
    })

    it('should handle null/undefined service response', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile, {
        jobTitle: 'Senior Software Engineer',
        company: 'Tech Corp'
      })
      const request = createNextRequestWithFormData(formData)

      mockAddWorkExperience.mockResolvedValue(null as any)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(result.success).toBe(false)
      expect(result.error).toContain('unknown error')
    })
  })
}) 