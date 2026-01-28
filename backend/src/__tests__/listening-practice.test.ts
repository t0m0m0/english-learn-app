import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'

const mockPassage = {
  id: 'passage-1',
  title: 'At the Coffee Shop',
  text: 'Sarah walks into a coffee shop every morning. She orders a large cappuccino and a blueberry muffin.',
  difficulty: 'beginner',
  topic: 'daily life',
  order: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockQuestion = {
  id: 'question-1',
  passageId: 'passage-1',
  type: 'multiple_choice',
  question: 'What does Sarah order?',
  options: JSON.stringify(['A cappuccino and a muffin', 'A tea and a cookie', 'A latte and a cake', 'A coffee and a sandwich']),
  answer: 'A cappuccino and a muffin',
  order: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockProgress = {
  id: 'progress-1',
  userId: 1,
  questionId: 'question-1',
  isCorrect: true,
  answeredAt: new Date('2024-01-15'),
}

const createMockPrisma = () => ({
  listeningPassage: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
  },
  listeningQuestion: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
  },
  listeningProgress: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(({ data }) => {
      return Promise.resolve({
        id: 'new-progress-id',
        ...data,
        answeredAt: new Date(),
      })
    }),
    count: vi.fn().mockResolvedValue(0),
  },
  // Include existing models so app.ts doesn't break
  lesson: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
  },
  qAItem: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
  },
  callanProgress: {
    findUnique: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
  },
  $transaction: vi.fn().mockImplementation(async (arg) => {
    if (Array.isArray(arg)) {
      return Promise.all(arg)
    }
    return arg(createMockPrisma())
  }),
})

describe('Listening Practice API', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    mockPrisma = createMockPrisma()
    app = createApp(mockPrisma)
  })

  describe('GET /api/listening/passages', () => {
    it('returns all passages', async () => {
      const passages = [
        { ...mockPassage, questions: [] },
        { ...mockPassage, id: 'passage-2', title: 'At the Park', order: 2, questions: [] },
      ]
      mockPrisma.listeningPassage.findMany.mockResolvedValueOnce(passages)

      const response = await request(app).get('/api/listening/passages')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('passages')
      expect(response.body.passages).toHaveLength(2)
    })

    it('filters by difficulty', async () => {
      mockPrisma.listeningPassage.findMany.mockResolvedValueOnce([
        { ...mockPassage, questions: [] },
      ])

      const response = await request(app).get('/api/listening/passages?difficulty=beginner')

      expect(response.status).toBe(200)
      expect(mockPrisma.listeningPassage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ difficulty: 'beginner' }),
        })
      )
    })

    it('returns passages ordered by order field', async () => {
      mockPrisma.listeningPassage.findMany.mockResolvedValueOnce([])

      await request(app).get('/api/listening/passages')

      expect(mockPrisma.listeningPassage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { order: 'asc' },
        })
      )
    })
  })

  describe('GET /api/listening/passages/:id', () => {
    it('returns a passage with its questions', async () => {
      const passageWithQuestions = {
        ...mockPassage,
        questions: [mockQuestion],
      }
      mockPrisma.listeningPassage.findUnique.mockResolvedValueOnce(passageWithQuestions)

      const response = await request(app).get('/api/listening/passages/passage-1')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('passage')
      expect(response.body.passage).toHaveProperty('title', 'At the Coffee Shop')
      expect(response.body.passage.questions).toHaveLength(1)
    })

    it('returns 404 when passage not found', async () => {
      mockPrisma.listeningPassage.findUnique.mockResolvedValueOnce(null)

      const response = await request(app).get('/api/listening/passages/non-existent')

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error', 'Passage not found')
    })
  })

  describe('POST /api/listening/progress', () => {
    it('records a correct answer', async () => {
      mockPrisma.listeningQuestion.findUnique.mockResolvedValueOnce(mockQuestion)

      const response = await request(app)
        .post('/api/listening/progress')
        .send({
          userId: 1,
          questionId: 'question-1',
          isCorrect: true,
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('progress')
      expect(response.body.progress).toHaveProperty('questionId', 'question-1')
      expect(response.body.progress).toHaveProperty('isCorrect', true)
    })

    it('records an incorrect answer', async () => {
      mockPrisma.listeningQuestion.findUnique.mockResolvedValueOnce(mockQuestion)

      const response = await request(app)
        .post('/api/listening/progress')
        .send({
          userId: 1,
          questionId: 'question-1',
          isCorrect: false,
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('progress')
      expect(response.body.progress).toHaveProperty('isCorrect', false)
    })

    it('returns 400 when userId is missing', async () => {
      const response = await request(app)
        .post('/api/listening/progress')
        .send({ questionId: 'question-1', isCorrect: true })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('returns 400 when questionId is missing', async () => {
      const response = await request(app)
        .post('/api/listening/progress')
        .send({ userId: 1, isCorrect: true })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('returns 400 when isCorrect is not boolean', async () => {
      const response = await request(app)
        .post('/api/listening/progress')
        .send({ userId: 1, questionId: 'question-1', isCorrect: 'yes' })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('returns 404 when question does not exist', async () => {
      mockPrisma.listeningQuestion.findUnique.mockResolvedValueOnce(null)

      const response = await request(app)
        .post('/api/listening/progress')
        .send({ userId: 1, questionId: 'non-existent', isCorrect: true })

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error', 'Question not found')
    })
  })

  describe('GET /api/listening/progress/summary', () => {
    it('returns progress summary for a user', async () => {
      const passages = [
        {
          ...mockPassage,
          questions: [
            { ...mockQuestion, id: 'q1' },
            { ...mockQuestion, id: 'q2' },
          ],
        },
      ]
      mockPrisma.listeningPassage.findMany.mockResolvedValueOnce(passages)
      mockPrisma.listeningProgress.findMany.mockResolvedValueOnce([
        { ...mockProgress, questionId: 'q1', isCorrect: true },
        { ...mockProgress, id: 'p2', questionId: 'q2', isCorrect: false },
      ])

      const response = await request(app)
        .get('/api/listening/progress/summary?userId=1')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('totalPassages')
      expect(response.body).toHaveProperty('totalQuestions')
      expect(response.body).toHaveProperty('answeredQuestions')
      expect(response.body).toHaveProperty('correctAnswers')
      expect(response.body).toHaveProperty('accuracy')
    })

    it('returns 400 when userId is missing', async () => {
      const response = await request(app)
        .get('/api/listening/progress/summary')

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('returns zero values when no progress exists', async () => {
      mockPrisma.listeningPassage.findMany.mockResolvedValueOnce([])
      mockPrisma.listeningProgress.findMany.mockResolvedValueOnce([])

      const response = await request(app)
        .get('/api/listening/progress/summary?userId=1')

      expect(response.status).toBe(200)
      expect(response.body.totalPassages).toBe(0)
      expect(response.body.totalQuestions).toBe(0)
      expect(response.body.answeredQuestions).toBe(0)
      expect(response.body.correctAnswers).toBe(0)
      expect(response.body.accuracy).toBe(0)
    })
  })
})
