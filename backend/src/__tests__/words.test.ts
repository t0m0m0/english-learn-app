import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'

const mockWords = [
  { id: 1, word: 'the', partOfSpeech: 'article', frequency: 1, definition: 'definite article', exampleSentence: 'The cat sat on the mat.' },
  { id: 2, word: 'be', partOfSpeech: 'verb', frequency: 2, definition: 'to exist', exampleSentence: 'I want to be happy.' },
  { id: 3, word: 'to', partOfSpeech: 'preposition', frequency: 3, definition: 'indicating direction', exampleSentence: 'Go to the store.' },
]

const createMockPrisma = () => ({
  word: {
    findMany: vi.fn().mockResolvedValue(mockWords),
    count: vi.fn().mockResolvedValue(3),
    findUnique: vi.fn().mockImplementation(({ where }) => {
      const found = mockWords.find(w => w.id === where.id)
      return Promise.resolve(found || null)
    }),
  },
  $queryRaw: vi.fn().mockResolvedValue(mockWords.slice(0, 2)),
})

describe('Words API', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    mockPrisma = createMockPrisma()
    app = createApp(mockPrisma)
  })

  describe('GET /api/words', () => {
    it('returns paginated words list', async () => {
      const response = await request(app).get('/api/words')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('words')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.words).toHaveLength(3)
    })

    it('respects pagination parameters', async () => {
      await request(app).get('/api/words?page=2&limit=10')

      expect(mockPrisma.word.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      )
    })
  })

  describe('GET /api/words/:id', () => {
    it('returns a word by id', async () => {
      const response = await request(app).get('/api/words/1')

      expect(response.status).toBe(200)
      expect(response.body.word).toEqual(mockWords[0])
    })

    it('returns 404 for non-existent word', async () => {
      const response = await request(app).get('/api/words/999')

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error', 'Word not found')
    })
  })

  describe('GET /api/words/range/:start/:end', () => {
    it('returns words within frequency range', async () => {
      const response = await request(app).get('/api/words/range/1/100')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('words')
      expect(response.body).toHaveProperty('count')
    })
  })

  describe('GET /api/words/random', () => {
    it('returns random words', async () => {
      const response = await request(app).get('/api/words/random?count=5')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('words')
    })
  })
})
