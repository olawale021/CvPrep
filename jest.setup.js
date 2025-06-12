import '@testing-library/jest-dom'
import 'whatwg-fetch'

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-api-key'
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_ANON_KEY = 'test-anon-key'

// Mock Web API globals for Next.js
import { Headers, Request, Response } from 'undici'

global.Request = Request
global.Response = Response
global.Headers = Headers

// Mock NextRequest and NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      headers: new Headers(init?.headers || {}),
    })),
    redirect: jest.fn(),
  },
}))

// Mock FormData if not available
if (typeof global.FormData === 'undefined') {
  global.FormData = class FormData {
    constructor() {
      this.data = new Map()
    }
    
    append(key, value) {
      if (!this.data.has(key)) {
        this.data.set(key, [])
      }
      this.data.get(key).push(value)
    }
    
    get(key) {
      const values = this.data.get(key)
      return values ? values[0] : null
    }
    
    getAll(key) {
      return this.data.get(key) || []
    }
    
    has(key) {
      return this.data.has(key)
    }
    
    set(key, value) {
      this.data.set(key, [value])
    }
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  }
}))

// Mock Supabase client
jest.mock('./lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  }
}))

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }))
})

// Global fetch mock
global.fetch = jest.fn()

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
}) 