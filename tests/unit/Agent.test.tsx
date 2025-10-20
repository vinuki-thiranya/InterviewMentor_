/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Agent from '@/components/Agent'

// Mock Next.js router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
}

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

// Mock VAPI SDK
const mockVapi = {
  start: jest.fn(),
  stop: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
}

jest.mock('@/lib/vapi.sdk', () => ({
  vapi: mockVapi,
}))

// Mock actions
const mockCreateFeedback = jest.fn()
jest.mock('@/lib/actions/general.action', () => ({
  createFeedback: mockCreateFeedback,
}))

// Mock constants
jest.mock('@/constants', () => ({
  interviewCovers: ['/cover1.jpg', '/cover2.jpg'],
  mappings: {
    javascript: 'javascript',
    react: 'react',
  },
}))

// Mock global fetch
global.fetch = jest.fn()

describe('Agent Component', () => {
  const defaultProps = {
    userName: 'John Doe',
    userId: 'user123',
    interviewId: 'interview123',
    feedbackId: 'feedback123',
    type: 'interview',
    questions: [
      'Tell me about yourself',
      'What are your strengths?',
      'Describe a challenging project',
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateFeedback.mockResolvedValue({ success: true })
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, interviewId: 'generated123' }),
    })
  })

  describe('Rendering', () => {
    it('should render user profile and AI interviewer cards', () => {
      render(<Agent {...defaultProps} />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('AI Interviewer')).toBeInTheDocument()
      expect(screen.getByAltText('profile-image')).toBeInTheDocument()
    })

    it('should show call button initially', () => {
      render(<Agent {...defaultProps} />)
      
      const callButton = screen.getByText('Call')
      expect(callButton).toBeInTheDocument()
    })

    it('should display connecting state when call is initiated', async () => {
      render(<Agent {...defaultProps} />)
      
      const callButton = screen.getByText('Call')
      fireEvent.click(callButton)

      expect(screen.getByText('. . .')).toBeInTheDocument()
    })
  })

  describe('Call Functionality', () => {
    it('should start VAPI call for interview mode', async () => {
      render(<Agent {...defaultProps} />)
      
      const callButton = screen.getByText('Call')
      fireEvent.click(callButton)

      await waitFor(() => {
        expect(mockVapi.start).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Interview Assistant',
            firstMessage: expect.stringContaining('John Doe'),
            model: expect.objectContaining({
              provider: 'openai',
              model: 'gpt-3.5-turbo',
            }),
          })
        )
      })
    })

    it('should start VAPI call for generate mode', async () => {
      const generateProps = {
        ...defaultProps,
        type: 'generate',
        questions: undefined,
      }

      render(<Agent {...generateProps} />)
      
      const callButton = screen.getByText('Call')
      fireEvent.click(callButton)

      await waitFor(() => {
        expect(mockVapi.start).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'MockMate Interview Generator',
            firstMessage: expect.stringContaining('Hello John Doe'),
          })
        )
      })
    })

    it('should show end button when call is active', async () => {
      render(<Agent {...defaultProps} />)
      
      // Simulate call start event
      const onCallStartCallback = mockVapi.on.mock.calls.find(
        call => call[0] === 'call-start'
      )?.[1]
      
      if (onCallStartCallback) {
        onCallStartCallback()
      }

      await waitFor(() => {
        expect(screen.getByText('End')).toBeInTheDocument()
      })
    })

    it('should end call when end button is clicked', async () => {
      render(<Agent {...defaultProps} />)
      
      // Start the call first
      const callButton = screen.getByText('Call')
      fireEvent.click(callButton)

      // Simulate call start
      const onCallStartCallback = mockVapi.on.mock.calls.find(
        call => call[0] === 'call-start'
      )?.[1]
      
      if (onCallStartCallback) {
        onCallStartCallback()
      }

      await waitFor(() => {
        const endButton = screen.getByText('End')
        fireEvent.click(endButton)
        expect(mockVapi.stop).toHaveBeenCalled()
      })
    })
  })

  describe('Message Handling', () => {
    it('should display transcript messages', async () => {
      render(<Agent {...defaultProps} />)
      
      // Simulate message event
      const onMessageCallback = mockVapi.on.mock.calls.find(
        call => call[0] === 'message'
      )?.[1]

      const mockMessage = {
        type: 'transcript',
        role: 'assistant',
        transcript: 'Hello, let\'s start the interview',
        transcriptType: 'final',
      }

      if (onMessageCallback) {
        onMessageCallback(mockMessage)
      }

      await waitFor(() => {
        expect(screen.getByText('Hello, let\'s start the interview')).toBeInTheDocument()
      })
    })

    it('should handle speaking animation', async () => {
      render(<Agent {...defaultProps} />)
      
      // Simulate speech start event
      const onSpeechStartCallback = mockVapi.on.mock.calls.find(
        call => call[0] === 'speech-start'
      )?.[1]

      if (onSpeechStartCallback) {
        onSpeechStartCallback()
      }

      await waitFor(() => {
        const speakingIndicator = document.querySelector('.animate-speak')
        expect(speakingIndicator).toBeInTheDocument()
      })
    })
  })

  describe('Interview Generation Flow', () => {
    it('should trigger interview generation in generate mode', async () => {
      const generateProps = {
        ...defaultProps,
        type: 'generate' as const,
        questions: undefined,
      }

      render(<Agent {...generateProps} />)
      
      // Simulate message that triggers generation
      const onMessageCallback = mockVapi.on.mock.calls.find(
        call => call[0] === 'message'
      )?.[1]

      const triggerMessage = {
        type: 'transcript',
        role: 'assistant',
        transcript: 'Perfect! I have all the information I need. Let me generate your interview questions now.',
        transcriptType: 'final',
      }

      if (onMessageCallback) {
        onMessageCallback(triggerMessage)
      }

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/vapi/generate',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        )
      }, { timeout: 3000 })
    })

    it('should redirect after goodbye message in generate mode', async () => {
      const generateProps = {
        ...defaultProps,
        type: 'generate' as const,
        questions: undefined,
      }

      render(<Agent {...generateProps} />)
      
      // Simulate goodbye message
      const onMessageCallback = mockVapi.on.mock.calls.find(
        call => call[0] === 'message'
      )?.[1]

      const goodbyeMessage = {
        type: 'transcript',
        role: 'assistant',
        transcript: 'Thank you for using MockMate. Goodbye!',
        transcriptType: 'final',
      }

      if (onMessageCallback) {
        onMessageCallback(goodbyeMessage)
      }

      await waitFor(() => {
        expect(mockVapi.stop).toHaveBeenCalled()
      }, { timeout: 4000 })
    })
  })

  describe('Error Handling', () => {
    it('should handle VAPI errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      render(<Agent {...defaultProps} />)
      
      // Simulate error event
      const onErrorCallback = mockVapi.on.mock.calls.find(
        call => call[0] === 'error'
      )?.[1]

      const mockError = {
        message: 'Connection failed',
        type: 'connection_error',
      }

      if (onErrorCallback) {
        onErrorCallback(mockError)
      }

      expect(consoleSpy).toHaveBeenCalledWith('VAPI Error:', mockError)
      
      consoleSpy.mockRestore()
    })
  })

  describe('Cleanup', () => {
    it('should clean up event listeners on unmount', () => {
      const { unmount } = render(<Agent {...defaultProps} />)
      
      unmount()

      // Verify all event listeners were removed
      expect(mockVapi.off).toHaveBeenCalledWith('call-start', expect.any(Function))
      expect(mockVapi.off).toHaveBeenCalledWith('call-end', expect.any(Function))
      expect(mockVapi.off).toHaveBeenCalledWith('message', expect.any(Function))
      expect(mockVapi.off).toHaveBeenCalledWith('speech-start', expect.any(Function))
      expect(mockVapi.off).toHaveBeenCalledWith('speech-end', expect.any(Function))
      expect(mockVapi.off).toHaveBeenCalledWith('error', expect.any(Function))
    })
  })
})