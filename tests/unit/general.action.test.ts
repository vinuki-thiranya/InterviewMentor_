/**
 * @jest-environment node
 */

// Mock Firebase admin before importing
const mockAdd = jest.fn()
const mockGet = jest.fn()
const mockDoc = jest.fn(() => ({ get: mockGet }))
const mockWhere = jest.fn(() => ({ get: mockGet }))
const mockCollection = jest.fn(() => ({
  add: mockAdd,
  doc: mockDoc,
  where: mockWhere,
}))

jest.doMock('@/firebase/admin', () => ({
  db: {
    collection: mockCollection,
  },
}))

// Import after mock
const { getUserInterviews, getInterviewById } = require('@/lib/actions/general.action')

describe('General Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserInterviews', () => {
    it('should fetch and sort user interviews correctly', async () => {
      const mockInterviews = [
        {
          id: 'doc1',
          data: () => ({
            userId: 'user123',
            createdAt: '2024-01-15T10:00:00Z',
            role: 'Frontend Developer',
          }),
        },
        {
          id: 'doc2',
          data: () => ({
            userId: 'user123',
            createdAt: '2024-01-20T10:00:00Z',
            role: 'Backend Developer',
          }),
        },
      ]

      mockGet.mockResolvedValue({
        docs: mockInterviews,
      })

      const result = await getUserInterviews('user123')

      expect(result.success).toBe(true)
      expect(result.interviews).toHaveLength(2)
      // Check if sorted by createdAt (newest first)
      expect(result.interviews[0].id).toBe('doc2')
      expect(result.interviews[1].id).toBe('doc1')
    })

    it('should handle empty results', async () => {
      mockGet.mockResolvedValue({
        docs: [],
      })

      const result = await getUserInterviews('user123')

      expect(result.success).toBe(true)
      expect(result.interviews).toHaveLength(0)
    })

    it('should handle database errors', async () => {
      mockGet.mockRejectedValue(new Error('Database error'))

      const result = await getUserInterviews('user123')

      expect(result.success).toBe(false)
      expect(result.interviews).toEqual([])
      expect(result.error).toBe('Database error')
    })
  })

  describe('getInterviewById', () => {
    it('should fetch interview by ID successfully', async () => {
      const mockInterview = {
        exists: true,
        id: 'interview123',
        data: () => ({
          role: 'Frontend Developer',
          questions: ['Question 1', 'Question 2'],
          userId: 'user123',
        }),
      }

      mockGet.mockResolvedValue(mockInterview)

      const result = await getInterviewById('interview123')

      expect(result.success).toBe(true)
      expect(result.interview).toEqual({
        id: 'interview123',
        role: 'Frontend Developer',
        questions: ['Question 1', 'Question 2'],
        userId: 'user123',
      })
    })

    it('should handle non-existent interview', async () => {
      mockGet.mockResolvedValue({
        exists: false,
      })

      const result = await getInterviewById('nonexistent')

      expect(result.success).toBe(false)
      expect(result.interview).toBe(null)
      expect(result.error).toBe('Interview not found')
    })

    it('should handle database errors', async () => {
      mockGet.mockRejectedValue(new Error('Database error'))

      const result = await getInterviewById('interview123')

      expect(result.success).toBe(false)
      expect(result.interview).toBe(null)
      expect(result.error).toBe('Database error')
    })
  })
})