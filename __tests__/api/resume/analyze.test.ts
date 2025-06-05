import { POST } from '../../../app/api/resume/analyze/route'
import {
    createFormDataWithFile,
    createMockPDFFile,
    createNextRequestWithFormData,
    SAMPLE_JOB_DESCRIPTION,
    SAMPLE_RESUME_TEXT,
    TEST_TIMEOUT
} from '../../utils/test-helpers'

// Mock the resume analysis services
jest.mock('../../../lib/resume/extractContactDetails', () => ({
  extractContactDetails: jest.fn()
}))

jest.mock('../../../lib/resume/fileParser', () => ({
  extractTextFromFile: jest.fn()
}))

jest.mock('../../../lib/resume/resumeParser', () => ({
  structure_resume: jest.fn()
}))

import { extractContactDetails } from '../../../lib/resume/extractContactDetails'
import { extractTextFromFile } from '../../../lib/resume/fileParser'
import { structure_resume } from '../../../lib/resume/resumeParser'

describe('/api/resume/analyze', () => {
  const mockExtractContactDetails = extractContactDetails as jest.MockedFunction<typeof extractContactDetails>
  const mockExtractTextFromFile = extractTextFromFile as jest.MockedFunction<typeof extractTextFromFile>
  const mockStructureResume = structure_resume as jest.MockedFunction<typeof structure_resume>

  const mockStructuredResume = {
    Summary: "Experienced software engineer with 5+ years of experience",
    "Work Experience": [
      {
        company: "Tech Corp",
        role: "Senior Software Engineer",
        date_range: "2021-Present",
        accomplishments: ["Led team of 4 developers", "Improved performance by 40%"]
      }
    ],
    "Technical Skills": ["JavaScript", "React", "Node.js", "AWS"],
    Education: [
      {
        institution: "University of Technology",
        degree: "Bachelor of Science in Computer Science",
        graduation_date: "2019"
      }
    ],
    Certifications: ["AWS Certified Solutions Architect"],
    Projects: ["E-commerce platform using React and Node.js"]
  }

  const mockContactDetails = {
    name: "John Doe",
    email: "john.doe@email.com",
    phone_number: "(555) 123-4567",
    location: "New York, NY"
  }

  beforeEach(() => {
    mockExtractContactDetails.mockClear()
    mockExtractTextFromFile.mockClear()
    mockStructureResume.mockClear()
    
    // Default successful mocks
    mockExtractTextFromFile.mockResolvedValue(SAMPLE_RESUME_TEXT)
    mockStructureResume.mockResolvedValue(mockStructuredResume)
    mockExtractContactDetails.mockResolvedValue(mockContactDetails)
  })

  describe('POST /api/resume/analyze', () => {
    it('should analyze resume with valid file and job description', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile)
      formData.append('job', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData, 'http://localhost:3000/api/resume/analyze')

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result).toHaveProperty('summary')
      expect(result).toHaveProperty('contact_details')
      expect(result).toHaveProperty('work_experience')
      expect(result).toHaveProperty('skills')
      expect(result).toHaveProperty('education')
      expect(result).toHaveProperty('certifications')
      expect(result).toHaveProperty('projects')
      
      // Verify service calls
      expect(mockExtractTextFromFile).toHaveBeenCalledWith(expect.any(Buffer), 'application/pdf')
      expect(mockStructureResume).toHaveBeenCalledWith(SAMPLE_RESUME_TEXT)
      expect(mockExtractContactDetails).toHaveBeenCalledWith(SAMPLE_RESUME_TEXT)
    }, TEST_TIMEOUT)

    it('should handle missing file', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('job', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.error).toBe('No file provided')
      expect(mockExtractTextFromFile).not.toHaveBeenCalled()
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
      expect(result.error).toBe('No job description provided')
      expect(mockExtractTextFromFile).not.toHaveBeenCalled()
    })

    it('should validate file type', async () => {
      // Arrange
      const invalidFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      const formData = createFormDataWithFile(invalidFile)
      formData.append('job', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.error).toContain('Invalid file type')
      expect(mockExtractTextFromFile).not.toHaveBeenCalled()
    })

    it('should validate file size limit', async () => {
      // Arrange
      const largeContent = 'x'.repeat(6 * 1024 * 1024) // 6MB (over 5MB limit)
      const largeFile = new File([largeContent], 'large.pdf', { type: 'application/pdf' })
      const formData = createFormDataWithFile(largeFile)
      formData.append('job', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.error).toContain('File too large')
      expect(mockExtractTextFromFile).not.toHaveBeenCalled()
    })

    it('should handle insufficient text extraction', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile)
      formData.append('job', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      mockExtractTextFromFile.mockResolvedValue('short') // Too short

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.error).toContain('Could not extract sufficient text')
      expect(mockStructureResume).not.toHaveBeenCalled()
    })

    it('should handle resume structuring failure', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile)
      formData.append('job', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      mockStructureResume.mockResolvedValue(null as any)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(result.error).toContain('Failed to process resume structure')
    })

    it('should handle contact details extraction failure gracefully', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile)
      formData.append('job', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      mockExtractContactDetails.mockRejectedValue(new Error('Contact extraction failed'))

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200) // Should still succeed
      expect(result.contact_details).toEqual({}) // Empty fallback
    })

    it('should process technical skills correctly', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile)
      formData.append('job', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      const structuredResumeWithGroupedSkills = {
        ...mockStructuredResume,
        "Technical Skills": [
          "Programming Languages (JavaScript, Python, Java)",
          "Frontend: React, Vue.js",
          "Backend: Node.js, Express",
          "Databases: MongoDB, PostgreSQL"
        ]
      }
      mockStructureResume.mockResolvedValue(structuredResumeWithGroupedSkills)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.skills.technical_skills).toContain('JavaScript')
      expect(result.skills.technical_skills).toContain('Python')
      expect(result.skills.technical_skills).toContain('React')
      expect(result.skills.technical_skills).toContain('Node.js')
    })

    it('should process projects with technologies extraction', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile)
      formData.append('job', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      const structuredResumeWithProjects = {
        ...mockStructuredResume,
        Projects: [
          "E-commerce Platform\nBuilt a full-stack e-commerce application using React, Node.js, and MongoDB",
          "Task Management App\nDeveloped using Vue.js and Express with PostgreSQL database"
        ]
      }
      mockStructureResume.mockResolvedValue(structuredResumeWithProjects)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.projects).toHaveLength(2)
      expect(result.projects[0]).toHaveProperty('title')
      expect(result.projects[0]).toHaveProperty('description')
      expect(result.projects[0]).toHaveProperty('technologies')
    })

    it('should handle different file types correctly', async () => {
      // Arrange
      const allowedTypes = [
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]

      for (const fileType of allowedTypes) {
        const mockFile = new File(['content'], 'resume.' + fileType.split('/')[1], { type: fileType })
        const formData = createFormDataWithFile(mockFile)
        formData.append('job', SAMPLE_JOB_DESCRIPTION)
        const request = createNextRequestWithFormData(formData)

        // Act
        const response = await POST(request)

        // Assert
        expect(response.status).toBe(200)
        expect(mockExtractTextFromFile).toHaveBeenCalledWith(expect.any(Buffer), fileType)
      }
    })

    it('should handle work experience transformation', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile)
      formData.append('job', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.work_experience).toHaveLength(1)
      expect(result.work_experience[0]).toEqual({
        company: "Tech Corp",
        title: "Senior Software Engineer",
        dates: "2021-Present",
        accomplishments: ["Led team of 4 developers", "Improved performance by 40%"]
      })
    })

    it('should handle education transformation', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile)
      formData.append('job', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.education).toHaveLength(1)
      expect(result.education[0]).toEqual({
        degree: "Bachelor of Science in Computer Science",
        school: "University of Technology",
        dates: "2019"
      })
    })

    it('should handle empty sections gracefully', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile)
      formData.append('job', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      const emptyStructuredResume = {
        Summary: "",
        "Work Experience": [],
        "Technical Skills": [],
        Education: [],
        Certifications: [],
        Projects: []
      }
      mockStructureResume.mockResolvedValue(emptyStructuredResume)

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.summary).toBe("")
      expect(result.work_experience).toEqual([])
      expect(result.skills.technical_skills).toEqual([])
      expect(result.education).toEqual([])
      expect(result.certifications).toEqual([])
      expect(result.projects).toEqual([])
    })

    it('should handle file parsing errors', async () => {
      // Arrange
      const mockFile = createMockPDFFile()
      const formData = createFormDataWithFile(mockFile)
      formData.append('job', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      mockExtractTextFromFile.mockRejectedValue(new Error('File parsing failed'))

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(result.error).toContain('An error occurred')
    })
  })
}) 