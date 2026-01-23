import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  calculateNextReview,
  calculateNewLevel,
  getLevelDescription,
  calculateScore,
} from '../services/spaced-repetition'

describe('Spaced Repetition Algorithm', () => {
  describe('calculateNextReview', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns 1 minute interval for level 0', () => {
      const result = calculateNextReview(0)
      const expected = new Date('2024-01-01T12:01:00Z')
      expect(result.getTime()).toBe(expected.getTime())
    })

    it('returns 10 minutes interval for level 1', () => {
      const result = calculateNextReview(1)
      const expected = new Date('2024-01-01T12:10:00Z')
      expect(result.getTime()).toBe(expected.getTime())
    })

    it('returns 1 day interval for level 2', () => {
      const result = calculateNextReview(2)
      const expected = new Date('2024-01-02T12:00:00Z')
      expect(result.getTime()).toBe(expected.getTime())
    })

    it('returns 3 days interval for level 3', () => {
      const result = calculateNextReview(3)
      const expected = new Date('2024-01-04T12:00:00Z')
      expect(result.getTime()).toBe(expected.getTime())
    })

    it('returns 1 week interval for level 4', () => {
      const result = calculateNextReview(4)
      const expected = new Date('2024-01-08T12:00:00Z')
      expect(result.getTime()).toBe(expected.getTime())
    })

    it('returns 2 weeks interval for level 5', () => {
      const result = calculateNextReview(5)
      const expected = new Date('2024-01-15T12:00:00Z')
      expect(result.getTime()).toBe(expected.getTime())
    })

    it('defaults to level 5 interval for invalid level', () => {
      const result = calculateNextReview(99)
      const expected = new Date('2024-01-15T12:00:00Z')
      expect(result.getTime()).toBe(expected.getTime())
    })
  })

  describe('calculateNewLevel', () => {
    it('increases level for quality >= 3', () => {
      expect(calculateNewLevel(2, 3)).toBe(3)
      expect(calculateNewLevel(2, 4)).toBe(3)
      expect(calculateNewLevel(2, 5)).toBe(3)
    })

    it('caps level at 5', () => {
      expect(calculateNewLevel(5, 5)).toBe(5)
      expect(calculateNewLevel(5, 3)).toBe(5)
    })

    it('maintains level for quality 1-2', () => {
      expect(calculateNewLevel(3, 1)).toBe(3)
      expect(calculateNewLevel(3, 2)).toBe(3)
    })

    it('decreases level for quality 0', () => {
      expect(calculateNewLevel(3, 0)).toBe(2)
      expect(calculateNewLevel(5, 0)).toBe(4)
    })

    it('does not go below 0', () => {
      expect(calculateNewLevel(0, 0)).toBe(0)
    })

    it('handles level 0 correctly', () => {
      expect(calculateNewLevel(0, 5)).toBe(1)
      expect(calculateNewLevel(0, 2)).toBe(0)
      expect(calculateNewLevel(0, 0)).toBe(0)
    })
  })

  describe('getLevelDescription', () => {
    it('returns correct description for each level', () => {
      expect(getLevelDescription(0)).toBe('New')
      expect(getLevelDescription(1)).toBe('Learning')
      expect(getLevelDescription(2)).toBe('Familiar')
      expect(getLevelDescription(3)).toBe('Good')
      expect(getLevelDescription(4)).toBe('Strong')
      expect(getLevelDescription(5)).toBe('Mastered')
    })

    it('returns Unknown for invalid level', () => {
      expect(getLevelDescription(-1)).toBe('Unknown')
      expect(getLevelDescription(99)).toBe('Unknown')
    })
  })

  describe('calculateScore', () => {
    it('returns 0 for incorrect answer', () => {
      expect(calculateScore(1000, false, 2)).toBe(0)
      expect(calculateScore(500, false, 5)).toBe(0)
    })

    it('returns 5 for very quick correct answer (under 1.5s)', () => {
      expect(calculateScore(1000, true, 2)).toBe(5)
      expect(calculateScore(1499, true, 3)).toBe(5)
    })

    it('returns 4 for quick correct answer (1.5-3s)', () => {
      expect(calculateScore(1500, true, 2)).toBe(4)
      expect(calculateScore(2000, true, 2)).toBe(4)
      expect(calculateScore(2999, true, 2)).toBe(4)
    })

    it('returns 3 for slow correct answer (over 3s)', () => {
      expect(calculateScore(3000, true, 2)).toBe(3)
      expect(calculateScore(5000, true, 2)).toBe(3)
      expect(calculateScore(10000, true, 2)).toBe(3)
    })

    it('ignores currentLevel parameter in scoring', () => {
      expect(calculateScore(1000, true, 0)).toBe(5)
      expect(calculateScore(1000, true, 5)).toBe(5)
    })
  })
})
