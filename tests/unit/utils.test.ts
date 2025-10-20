/**
 * @jest-environment jsdom
 */
import { cn, getRandomInterviewCover } from '@/lib/utils'

describe('Utils Functions', () => {
  describe('cn function', () => {
    it('should merge classes correctly', () => {
      const result = cn('px-4', 'py-2', 'bg-blue-500')
      expect(result).toContain('px-4')
      expect(result).toContain('py-2')
      expect(result).toContain('bg-blue-500')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const result = cn('base-class', isActive && 'active-class')
      expect(result).toContain('base-class')
      expect(result).toContain('active-class')
    })

    it('should handle empty inputs', () => {
      const result = cn()
      expect(result).toBe('')
    })
  })

  describe('getRandomInterviewCover function', () => {
    it('should return a valid cover path', () => {
      const cover = getRandomInterviewCover()
      expect(cover).toMatch(/^\/covers\/.*/)
    })

    it('should always return a string', () => {
      const cover = getRandomInterviewCover()
      expect(typeof cover).toBe('string')
      expect(cover.length).toBeGreaterThan(0)
    })
  })
})