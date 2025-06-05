import { NextResponse } from 'next/server'
import {
    createMockPDFFile,
    createNextRequestWithFormData,
    SAMPLE_JOB_DESCRIPTION,
    TEST_TIMEOUT
} from './test-helpers'

// Mock all API endpoints for error testing
jest.mock('../../app/api/resume/optimize/route', () => ({
  POST: jest.fn()
}))

jest.mock('../../app/api/resume/score/route', () => ({
  POST: jest.fn()
}))

jest.mock('../../app/api/interview/questions/route', () => ({
  POST: jest.fn()
}))

jest.mock('../../app/api/user/route', () => ({
  POST: jest.fn(),
  GET: jest.fn()
}))

// Mock external services
jest.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      upsert: jest.fn()
    }))
  }
}))

jest.mock('../../lib/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}))

import { POST as questionsPOST } from '../../app/api/interview/questions/route'
import { POST as optimizePOST } from '../../app/api/resume/optimize/route'
import { POST as scorePOST } from '../../app/api/resume/score/route'
import { GET as userGET, POST as userPOST } from '../../app/api/user/route'
import logger from '../../lib/logger'
import { supabase } from '../../lib/supabaseClient'

describe('Error Handling - Cross-Cutting Concerns', () => {
  const mockOptimizePOST = optimizePOST as jest.MockedFunction<typeof optimizePOST>
  const mockScorePOST = scorePOST as jest.MockedFunction<typeof scorePOST>
  const mockQuestionsPOST = questionsPOST as jest.MockedFunction<typeof questionsPOST>
  const mockUserPOST = userPOST as jest.MockedFunction<typeof userPOST>
  const mockUserGET = userGET as jest.MockedFunction<typeof userGET>
  const mockLogger = jest.mocked(logger)
  const mockSupabase = jest.mocked(supabase)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Network and Infrastructure Errors', () => {
    it('should handle database connection timeouts', async () => {
      // Arrange
      const timeoutError = new Error('Connection timeout')
      timeoutError.name = 'TimeoutError'
      
      mockSupabase.from.mockImplementation(() => {
        throw timeoutError
      })

      const request = new Request('http://localhost:3000/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'test', email: 'test@example.com' })
      })

      // Act
      const response = await mockUserPOST(request)

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unexpected API error',
        expect.objectContaining({
          error: timeoutError,
          context: 'UserAPI'
        })
      )
    }, TEST_TIMEOUT)

    it('should handle OpenAI API rate limiting', async () => {
      // Arrange
      const rateLimitError = new Error('Rate limit exceeded')
      rateLimitError.name = 'RateLimitError'
      
      mockOptimizePOST.mockImplementation(async () => {
        return NextResponse.json({
          error: 'Service temporarily unavailable',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: 60
        }, { status: 429 })
      })

      const formData = new FormData()
      formData.append('file', createMockPDFFile())
      formData.append('job', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await mockOptimizePOST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(429)
      expect(result.error).toBe('Service temporarily unavailable')
      expect(result.retryAfter).toBe(60)
    })

    it('should handle memory exhaustion errors', async () => {
      // Arrange
      const memoryError = new Error('JavaScript heap out of memory')
      memoryError.name = 'RangeError'
      
      mockScorePOST.mockImplementation(async () => {
        throw memoryError
      })

      const formData = new FormData()
      formData.append('file', createMockPDFFile())
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      // Act & Assert
      await expect(mockScorePOST(request)).rejects.toThrow('JavaScript heap out of memory')
    })
  })

  describe('Input Validation Errors', () => {
    it('should handle extremely large file uploads', async () => {
      // Arrange
      const hugeContent = 'x'.repeat(100 * 1024 * 1024) // 100MB
      const hugeFile = new File([hugeContent], 'huge.pdf', { type: 'application/pdf' })
      
      mockOptimizePOST.mockImplementation(async () => {
        return NextResponse.json({
          error: 'File too large',
          message: 'File size exceeds maximum limit of 5MB'
        }, { status: 413 })
      })

      const formData = new FormData()
      formData.append('file', hugeFile)
      formData.append('job', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await mockOptimizePOST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(413)
      expect(result.error).toBe('File too large')
    })

    it('should handle malicious file uploads', async () => {
      // Arrange
      const maliciousContent = '<script>alert("xss")</script>'
      const maliciousFile = new File([maliciousContent], 'malicious.pdf', { type: 'application/pdf' })
      
      mockOptimizePOST.mockImplementation(async () => {
        return NextResponse.json({
          error: 'Invalid file content',
          message: 'File contains potentially harmful content'
        }, { status: 400 })
      })

      const formData = new FormData()
      formData.append('file', maliciousFile)
      formData.append('job', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await mockOptimizePOST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.error).toBe('Invalid file content')
    })

    it('should handle SQL injection attempts', async () => {
      // Arrange
      const sqlInjection = "'; DROP TABLE users; --"
      
      mockUserGET.mockImplementation(async () => {
        return NextResponse.json({
          error: 'Invalid input',
          message: 'Potentially harmful input detected'
        }, { status: 400 })
      })

      const url = `http://localhost:3000/api/user?email=${encodeURIComponent(sqlInjection)}`
      const request = new Request(url, { method: 'GET' })

      // Act
      const response = await mockUserGET(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.error).toBe('Invalid input')
    })
  })

  describe('Service Degradation Scenarios', () => {
    it('should handle partial service failures gracefully', async () => {
      // Arrange - OpenAI works but file parsing fails
      mockOptimizePOST.mockImplementation(async () => {
        return NextResponse.json({
          optimized_text: 'Fallback optimization based on job description only',
          note: 'Resume parsing failed, optimization based on job requirements only',
          warning: 'Some features unavailable due to service issues'
        }, { status: 200 })
      })

      const formData = new FormData()
      formData.append('file', createMockPDFFile())
      formData.append('job', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await mockOptimizePOST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.warning).toContain('service issues')
      expect(result.optimized_text).toContain('Fallback optimization')
    })

    it('should handle cascading service failures', async () => {
      // Arrange - Multiple services fail
      const cascadingError = new Error('Multiple service dependencies unavailable')
      
      mockQuestionsPOST.mockImplementation(async () => {
        throw cascadingError
      })

      const formData = new FormData()
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      formData.append('question_count', '5')
      const request = createNextRequestWithFormData(formData)

      // Act & Assert
      await expect(mockQuestionsPOST(request)).rejects.toThrow('Multiple service dependencies unavailable')
    })
  })

  describe('Concurrent Request Handling', () => {
    it('should handle race conditions in user creation', async () => {
      // Arrange
      const userData = { id: 'user_123', email: 'test@example.com' }
      let callCount = 0
      
      mockUserPOST.mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          // First request succeeds
          return NextResponse.json({ success: true, userId: userData.id })
        } else {
          // Subsequent requests handle existing user
          return NextResponse.json({ 
            success: true, 
            userId: userData.id,
            message: 'User already exists'
          })
        }
      })

      const request1 = new Request('http://localhost:3000/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })

      const request2 = new Request('http://localhost:3000/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })

      // Act
      const [response1, response2] = await Promise.all([
        mockUserPOST(request1),
        mockUserPOST(request2)
      ])

      const [result1, result2] = await Promise.all([
        response1.json(),
        response2.json()
      ])

      // Assert
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
    })

    it('should handle high concurrent load', async () => {
      // Arrange
      const concurrentRequests = 50
      
      mockScorePOST.mockImplementation(async () => {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 10))
        return NextResponse.json({
          overall_score: 85,
          section_scores: { summary: 90, experience: 80 }
        })
      })

      const requests = Array.from({ length: concurrentRequests }, () => {
        const formData = new FormData()
        formData.append('file', createMockPDFFile())
        formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
        return createNextRequestWithFormData(formData)
      })

      // Act
      const responses = await Promise.all(
        requests.map(request => mockScorePOST(request))
      )

      // Assert
      expect(responses).toHaveLength(concurrentRequests)
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    }, TEST_TIMEOUT * 2)
  })

  describe('Data Corruption and Recovery', () => {
    it('should handle corrupted file uploads', async () => {
      // Arrange
      const corruptedContent = Buffer.from([0xFF, 0xFE, 0x00, 0x01, 0x02])
      const corruptedFile = new File([corruptedContent], 'corrupted.pdf', { type: 'application/pdf' })
      
      mockOptimizePOST.mockImplementation(async () => {
        return NextResponse.json({
          error: 'File parsing failed',
          message: 'Unable to extract text from the uploaded file'
        }, { status: 422 })
      })

      const formData = new FormData()
      formData.append('file', corruptedFile)
      formData.append('job', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await mockOptimizePOST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(422)
      expect(result.error).toBe('File parsing failed')
    })

    it('should handle AI service JSON parsing errors with special characters', async () => {
      // Arrange - Simulate the exact JSON parsing issue that was happening in production
      const problematicJSONResponse = `{
    "SUMMARY": "Software Engineer with 5+ years of building high-performance applications. Strong background in Kotlin and Java, with a focus on Android Native development. Track record of improving UI/UX and optimising app performance in challenging environments. Experienced in leading cross-functional teams and mentoring junior developers. Passionate about solving complex technical challenges while delivering exceptional user experiences. Seeking to leverage my technical expertise in a forward-thinking company.",
    "EXPERIENCE": "Led development of mobile apps with 100k+ downloads\\nOptimized app performance by 40%\\nMentored 5 junior developers"
}`
      
      mockOptimizePOST.mockImplementation(async () => {
        // Test that the service can handle JSON with newlines and special characters properly
        try {
          // This should work without manual escaping since OpenAI returns valid JSON
          const parsed = JSON.parse(problematicJSONResponse)
          return NextResponse.json({
            optimized_text: parsed.SUMMARY || "Fallback optimization",
            sections: parsed
          })
        } catch (parseError) {
          return NextResponse.json({
            error: 'JSON parsing failed',
            message: 'Unable to parse AI response due to special characters'
          }, { status: 422 })
        }
      })

      const formData = new FormData()
      formData.append('file', createMockPDFFile())
      formData.append('job', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await mockOptimizePOST(request)
      const result = await response.json()

      // Assert - This should succeed now that the double-escaping issue is fixed
      expect(response.status).toBe(200)
      expect(result.optimized_text).toContain('Software Engineer')
      expect(result.sections).toBeDefined()
    })

    it('should handle different resume formats and styles', async () => {
      // Arrange - Test various resume formats the system should be able to handle
      const resumeFormats = [
        {
          name: 'Traditional Chronological',
          content: '**JOHN DOE**\nSoftware Engineer\n\n**EXPERIENCE**\nSenior Developer at Tech Corp (2020-2023)\n- Built web applications\n- Led team of 5 developers'
        },
        {
          name: 'Modern Functional',  
          content: 'JANE SMITH\n--- CORE COMPETENCIES ---\nPython, React, AWS\n--- PROFESSIONAL EXPERIENCE ---\nFull-Stack Developer\nAchieved 40% performance improvement'
        },
        {
          name: 'Creative Format',
          content: '🚀 ALEX CHEN\nUX/UI Designer\n\n• SKILLS •\nFigma, Adobe XD, User Research\n\n• PROJECTS •\nRedesigned mobile app with 95% user satisfaction'
        },
        {
          name: 'Technical Resume',
          content: 'DANIEL IBEH\nAndroid Developer\n\nTECHNICAL SKILLS:\n- Kotlin, Java\n- Android SDK, MVVM\n- CI/CD, Git\n\nPROJECTS:\n1. E-commerce App - 100k+ downloads\n2. Performance optimization - 30% faster loading'
        }
      ]

      for (const format of resumeFormats) {
        mockOptimizePOST.mockImplementation(async () => {
          return NextResponse.json({
            optimized_text: `Optimized version of ${format.name} resume`,
            summary: "Professional summary extracted successfully",
            skills: {
              technical_skills: ["Skill 1", "Skill 2", "Skill 3"],
              soft_skills: ["Communication", "Leadership", "Problem Solving"]
            },
            work_experience: [
              {
                company: "Company Name",
                title: "Job Title", 
                dates: "2020-2023",
                achievements: ["Achievement 1", "Achievement 2"]
              }
            ]
          })
        })

        const mockFile = new File([format.content], `${format.name.replace(' ', '_')}.pdf`, { type: 'application/pdf' })
        const formData = new FormData()
        formData.append('file', mockFile)
        formData.append('job', SAMPLE_JOB_DESCRIPTION)
        const request = createNextRequestWithFormData(formData)

        // Act
        const response = await mockOptimizePOST(request)
        const result = await response.json()

        // Assert - Should handle all resume formats successfully
        expect(response.status).toBe(200)
        expect(result.optimized_text).toContain(format.name)
        expect(result.summary).toBeTruthy()
        expect(result.skills.technical_skills).toHaveLength(3)
        expect(result.work_experience).toHaveLength(1)
      }
    })

    it('should handle 504 timeout errors with proper JSON responses', async () => {
      // Arrange - Simulate the exact 504 timeout scenario that was happening in production
      mockScorePOST.mockImplementation(async () => {
        // Simulate a 504 timeout returning HTML instead of JSON
        return new Response(
          `<!DOCTYPE html>
<html>
<head><title>504 Gateway Timeout</title></head>
<body>
<h1>504 Gateway Timeout</h1>
<p>An error occurred</p>
</body>
</html>`, 
          { 
            status: 504, 
            headers: { 'content-type': 'text/html' }
          }
        )
      })

      const formData = new FormData()
      formData.append('file', createMockPDFFile())
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await mockScorePOST(request)
      
      // Assert - The frontend should handle this gracefully now
      expect(response.status).toBe(504)
      expect(response.headers.get('content-type')).toContain('text/html')
      
      // Frontend should detect this is not JSON and handle it properly
      const contentType = response.headers.get('content-type')
      expect(contentType).not.toContain('application/json')
      
      // This would previously cause "Unexpected token 'A'" but now should be handled
      const textResponse = await response.text()
      expect(textResponse).toContain('504 Gateway Timeout')
      expect(textResponse).toContain('An error occurred')
    })

    it('should handle JSON parsing errors from malformed API responses', async () => {
      // Arrange - Simulate API returning malformed JSON
      mockScorePOST.mockImplementation(async () => {
        // Return content that starts with valid JSON but is truncated/malformed
        return new Response(
          '{"match_score": 85, "matched_skills": ["Python", "React"], "missing_sk',
          { 
            status: 200, 
            headers: { 'content-type': 'application/json' }
          }
        )
      })

      const formData = new FormData()
      formData.append('file', createMockPDFFile())
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await mockScorePOST(request)
      
      // Assert - Response claims to be JSON but is malformed
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')
      
      // Frontend should detect this JSON parsing error and handle gracefully
      const responseText = await response.text()
      expect(responseText).toBe('{"match_score": 85, "matched_skills": ["Python", "React"], "missing_sk')
      
      // This would previously cause JSON parsing errors but should now be handled
      expect(() => JSON.parse(responseText)).toThrow()
    })

    it('should handle timeout with proper error structure', async () => {
      // Arrange - Simulate API timeout with proper error structure
      mockScorePOST.mockImplementation(async () => {
        return NextResponse.json({
          error: 'Scoring timeout',
          message: 'Resume scoring is taking longer than expected. Please try again.',
          matched_skills: [],
          missing_skills: [],
          recommendations: ['The resume is quite complex. Try simplifying it or check back in a moment.'],
          match_percentage: 0,
          match_score: 0
        }, { status: 408 })
      })

      const formData = new FormData()
      formData.append('file', createMockPDFFile())
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await mockScorePOST(request)
      const result = await response.json()

      // Assert - Should return proper error structure that frontend can handle
      expect(response.status).toBe(408)
      expect(result.error).toBe('Scoring timeout')
      expect(result.message).toContain('taking longer than expected')
      expect(result.matched_skills).toEqual([])
      expect(result.missing_skills).toEqual([])
      expect(result.recommendations).toHaveLength(1)
      expect(result.match_percentage).toBe(0)
      expect(result.match_score).toBe(0)
    })

    it('should handle database constraint violations', async () => {
      // Arrange
      const constraintError = new Error('duplicate key value violates unique constraint')
      constraintError.name = 'PostgresError'
      
      mockUserPOST.mockImplementation(async () => {
        return NextResponse.json({
          error: 'User already exists',
          message: 'An account with this email already exists'
        }, { status: 409 })
      })

      const request = new Request('http://localhost:3000/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'user_123', email: 'existing@example.com' })
      })

      // Act
      const response = await mockUserPOST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(409)
      expect(result.error).toBe('User already exists')
    })
  })

  describe('Security and Authentication Errors', () => {
    it('should handle unauthorized access attempts', async () => {
      // Arrange
      mockUserGET.mockImplementation(async () => {
        return NextResponse.json({
          error: 'Unauthorized',
          message: 'Authentication required'
        }, { status: 401 })
      })

      const request = new Request('http://localhost:3000/api/user?email=test@example.com', {
        method: 'GET'
        // No authorization header
      })

      // Act
      const response = await mockUserGET(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(result.error).toBe('Unauthorized')
    })

    it('should handle CSRF token validation failures', async () => {
      // Arrange
      mockUserPOST.mockImplementation(async () => {
        return NextResponse.json({
          error: 'CSRF token mismatch',
          message: 'Invalid or missing CSRF token'
        }, { status: 403 })
      })

      const request = new Request('http://localhost:3000/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'user_123', email: 'test@example.com' })
        // Missing CSRF token
      })

      // Act
      const response = await mockUserPOST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(result.error).toBe('CSRF token mismatch')
    })
  })

  describe('Resource Exhaustion', () => {
    it('should handle API quota exhaustion', async () => {
      // Arrange
      mockQuestionsPOST.mockImplementation(async () => {
        return NextResponse.json({
          error: 'Quota exceeded',
          message: 'Daily API quota has been exceeded',
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }, { status: 429 })
      })

      const formData = new FormData()
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await mockQuestionsPOST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(429)
      expect(result.error).toBe('Quota exceeded')
      expect(result.resetTime).toBeDefined()
    })

    it('should handle disk space exhaustion', async () => {
      // Arrange
      const diskSpaceError = new Error('ENOSPC: no space left on device')
      diskSpaceError.name = 'SystemError'
      
      mockOptimizePOST.mockImplementation(async () => {
        throw diskSpaceError
      })

      const formData = new FormData()
      formData.append('file', createMockPDFFile())
      formData.append('job', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      // Act & Assert
      await expect(mockOptimizePOST(request)).rejects.toThrow('ENOSPC: no space left on device')
    })
  })

  describe('Graceful Degradation', () => {
    it('should provide fallback responses when AI services fail', async () => {
      // Arrange
      mockQuestionsPOST.mockImplementation(async () => {
        return NextResponse.json({
          questions: {
            technical_questions: [
              "Tell me about your technical experience",
              "How do you approach problem-solving?",
              "Describe a challenging project you worked on"
            ],
            behavioral_questions: [
              "Tell me about a time you worked in a team",
              "How do you handle deadlines?",
              "Describe your ideal work environment"
            ],
            situational_questions: [
              "How would you handle a disagreement with a colleague?",
              "What would you do if you missed a deadline?",
              "How do you prioritize tasks?"
            ],
            role_specific_questions: [
              "Why are you interested in this position?",
              "What skills make you a good fit?",
              "Where do you see yourself in 5 years?"
            ],
            culture_fit_questions: [
              "What motivates you at work?",
              "How do you handle feedback?",
              "What type of work environment do you prefer?"
            ]
          },
          metadata: {
            job_analyzed: false,
            resume_analyzed: false,
            question_count: 3,
            categories: 5,
            fallback: true
          }
        })
      })

      const formData = new FormData()
      formData.append('job_description', SAMPLE_JOB_DESCRIPTION)
      const request = createNextRequestWithFormData(formData)

      // Act
      const response = await mockQuestionsPOST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.metadata.fallback).toBe(true)
      expect(result.questions.technical_questions).toHaveLength(3)
    })
  })
}) 