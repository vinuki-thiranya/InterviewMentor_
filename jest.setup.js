import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Firebase
jest.mock('./firebase/admin', () => ({
  db: {
    collection: jest.fn(() => ({
      add: jest.fn(),
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
      where: jest.fn(() => ({
        get: jest.fn(),
        limit: jest.fn(() => ({
          get: jest.fn(),
        })),
      })),
      get: jest.fn(),
    })),
  },
}))

// Mock VAPI SDK
jest.mock('./lib/vapi.sdk', () => ({
  vapi: {
    start: jest.fn(),
    stop: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
}))

// Mock AI SDK
jest.mock('ai', () => ({
  generateText: jest.fn(),
  generateObject: jest.fn(),
}))

// Mock Google AI SDK
jest.mock('@ai-sdk/google', () => ({
  google: jest.fn(() => 'mocked-model'),
}))

// Setup global fetch mock with proper Jest mock
const mockFetch = jest.fn()
global.fetch = mockFetch

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks()
})