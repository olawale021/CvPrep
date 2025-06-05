import { GET, POST } from '../../../app/api/user/route'
import {
    TEST_TIMEOUT
} from '../../utils/test-helpers'

// Mock Supabase client
jest.mock('../../../lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn()
  }
}))

// Mock logger
jest.mock('../../../lib/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
}))

import logger from '../../../lib/logger'
import { supabase } from '../../../lib/supabaseClient'

// Mock user data for testing
const MOCK_USER_DATA = {
  id: 'user_123',
  email: 'test@example.com',
  name: 'John Doe',
  image: 'https://example.com/avatar.jpg',
  googleId: 'google_123',
  type: 'premium'
}

const MOCK_EXISTING_USER = {
  type: 'free'
}

describe('/api/user', () => {
  const mockFrom = jest.mocked(supabase.from)
  const mockLogger = jest.mocked(logger)

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Set up default mock chain
    const mockSelect = jest.fn()
    const mockEq = jest.fn()
    const mockSingle = jest.fn()
    const mockUpsert = jest.fn()
    
    mockFrom.mockReturnValue({
      select: mockSelect,
      upsert: mockUpsert
    } as any)
    
    mockSelect.mockReturnValue({
      eq: mockEq
    } as any)
    
    mockEq.mockReturnValue({
      single: mockSingle
    } as any)
    
    mockUpsert.mockReturnValue({
      error: null
    } as any)
    
    // Default: no existing user
    mockSingle.mockResolvedValue({ data: null, error: null })
  })

  describe('POST /api/user', () => {
    it('should create new user with valid data', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(MOCK_USER_DATA)
      })

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.userId).toBe(MOCK_USER_DATA.id)
      
      expect(mockFrom).toHaveBeenCalledWith('users')
      expect(mockLogger.info).toHaveBeenCalledWith(
        'User data saved successfully',
        expect.objectContaining({
          email: MOCK_USER_DATA.email,
          context: 'UserAPI'
        })
      )
    }, TEST_TIMEOUT)

    it('should preserve existing user type when updating', async () => {
      // Arrange
      const mockSingle = jest.fn().mockResolvedValue({ 
        data: MOCK_EXISTING_USER, 
        error: null 
      })
      
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: mockSingle
        })
      })
      
      const mockUpsert = jest.fn().mockReturnValue({ error: null })
      
      mockFrom.mockReturnValue({
        select: mockSelect,
        upsert: mockUpsert
      } as any)

      const request = new Request('http://localhost:3000/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(MOCK_USER_DATA)
      })

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      
      // Verify the upsert was called with preserved user type
      expect(mockUpsert).toHaveBeenCalledWith(
        [expect.objectContaining({
          type: 'free' // should preserve existing type
        })],
        { onConflict: 'email' }
      )
    })

    it('should use provided type for new users', async () => {
      // Arrange
      const mockUpsert = jest.fn().mockReturnValue({ error: null })
      
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        }),
        upsert: mockUpsert
      } as any)

      const request = new Request('http://localhost:3000/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(MOCK_USER_DATA)
      })

      // Act
      await POST(request)

      // Assert
      expect(mockUpsert).toHaveBeenCalledWith(
        [expect.objectContaining({
          type: 'premium' // should use provided type
        })],
        { onConflict: 'email' }
      )
    })

    it('should handle missing required fields', async () => {
      // Arrange
      const invalidData = {
        name: 'John Doe',
        image: 'https://example.com/avatar.jpg'
        // missing id and email
      }

      const request = new Request('http://localhost:3000/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.error).toBe('Invalid user data')
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid user data for database save',
        expect.objectContaining({
          context: 'UserAPI'
        })
      )
    })

    it('should handle database errors', async () => {
      // Arrange
      const dbError = { message: 'Database connection failed' }
      const mockUpsert = jest.fn().mockReturnValue({ error: dbError })
      
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        }),
        upsert: mockUpsert
      } as any)

      const request = new Request('http://localhost:3000/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(MOCK_USER_DATA)
      })

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(result.error).toBe(dbError.message)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Database save error',
        expect.objectContaining({
          error: dbError.message,
          context: 'UserAPI'
        })
      )
    })

    it('should handle malformed JSON', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json}'
      })

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(result.error).toBe('Server error')
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unexpected API error',
        expect.objectContaining({
          context: 'UserAPI'
        })
      )
    })

    it('should set default values for optional fields', async () => {
      // Arrange
      const minimalData = {
        id: 'user_456',
        email: 'minimal@example.com'
      }

      const mockUpsert = jest.fn().mockReturnValue({ error: null })
      
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        }),
        upsert: mockUpsert
      } as any)

      const request = new Request('http://localhost:3000/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(minimalData)
      })

      // Act
      await POST(request)

      // Assert
      expect(mockUpsert).toHaveBeenCalledWith(
        [expect.objectContaining({
          id: 'user_456',
          email: 'minimal@example.com',
          full_name: 'minimal@example.com', // defaults to email
          profile_picture: null,
          type: 'free', // defaults to free
          auth_provider: 'google',
          is_active: true,
          is_verified: true
        })],
        { onConflict: 'email' }
      )
    })

    it('should handle empty request body', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: ''
      })

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(result.error).toBe('Server error')
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should set timestamps correctly', async () => {
      // Arrange
      const beforeTime = new Date().toISOString()
      
      const mockUpsert = jest.fn().mockReturnValue({ error: null })
      
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        }),
        upsert: mockUpsert
      } as any)

      const request = new Request('http://localhost:3000/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(MOCK_USER_DATA)
      })

      // Act
      await POST(request)
      
      const afterTime = new Date().toISOString()

      // Assert
      const calledWith = mockUpsert.mock.calls[0][0][0]
      expect(calledWith.last_login).toBeDefined()
      expect(calledWith.created_at).toBeDefined()
      expect(calledWith.last_login >= beforeTime).toBe(true)
      expect(calledWith.last_login <= afterTime).toBe(true)
    })
  })

  describe('GET /api/user', () => {
    it('should retrieve user by email', async () => {
      // Arrange
      const mockUserData = {
        id: 'user_123',
        email: 'test@example.com',
        full_name: 'John Doe',
        type: 'premium'
      }

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockUserData, error: null })
        })
      })

      mockFrom.mockReturnValue({
        select: mockSelect
      } as any)

      const url = 'http://localhost:3000/api/user?email=test@example.com'
      const request = new Request(url, { method: 'GET' })

      // Act
      const response = await GET(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.user).toEqual(mockUserData)
      expect(mockFrom).toHaveBeenCalledWith('users')
      expect(mockSelect).toHaveBeenCalledWith('*')
    })

    it('should handle missing email parameter', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/user'
      const request = new Request(url, { method: 'GET' })

      // Act
      const response = await GET(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.error).toBe('Email required')
    })

    it('should handle user not found', async () => {
      // Arrange
      const dbError = { message: 'User not found' }

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: dbError })
          })
        })
      } as any)

      const url = 'http://localhost:3000/api/user?email=nonexistent@example.com'
      const request = new Request(url, { method: 'GET' })

      // Act
      const response = await GET(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(result.error).toBe(dbError.message)
    })

    it('should handle empty email parameter', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/user?email='
      const request = new Request(url, { method: 'GET' })

      // Act
      const response = await GET(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.error).toBe('Email required')
    })

    it('should handle malformed email parameter', async () => {
      // Arrange
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        })
      })

      mockFrom.mockReturnValue({
        select: mockSelect
      } as any)

      const url = 'http://localhost:3000/api/user?email=invalid-email'
      const request = new Request(url, { method: 'GET' })

      // Act
      const response = await GET(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.user).toBe(null)
    })

    it('should handle multiple email parameters', async () => {
      // Arrange
      const mockUserData = { id: 'user_123', email: 'first@example.com' }

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockUserData, error: null })
          })
        })
      } as any)

      const url = 'http://localhost:3000/api/user?email=first@example.com&email=second@example.com'
      const request = new Request(url, { method: 'GET' })

      // Act
      const response = await GET(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.user).toEqual(mockUserData)
      // Should use the first email parameter
    })
  })

  describe('Error Handling', () => {
    it('should handle unexpected errors in POST', async () => {
      // Arrange
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected database error')
      })

      const request = new Request('http://localhost:3000/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(MOCK_USER_DATA)
      })

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(result.error).toBe('Server error')
      expect(result.message).toBe('Unexpected database error')
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unexpected API error',
        expect.objectContaining({
          context: 'UserAPI'
        })
      )
    })

    it('should handle non-Error exceptions', async () => {
      // Arrange
      mockFrom.mockImplementation(() => {
        throw 'String error'
      })

      const request = new Request('http://localhost:3000/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(MOCK_USER_DATA)
      })

      // Act
      const response = await POST(request)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(result.error).toBe('Server error')
      expect(result.message).toBe('String error')
    })
  })
}) 