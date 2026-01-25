import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'

const mockQAItem = {
  id: 'qa-1',
  question: 'What is this?',
  answer: 'This is a pen.',
  order: 1,
  lessonId: 'lesson-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockCallanProgress = {
  id: 'progress-1',
  userId: 1,
  qaItemId: 'qa-1',
  mode: 'qa',
  correctCount: 5,
  totalCount: 10,
  lastPracticed: new Date('2024-01-15'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
}

const createMockPrisma = () => ({
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
    findUnique: vi.fn().mockImplementation(({ where }) => {
      if (where.id === 'qa-1') {
        return Promise.resolve(mockQAItem)
      }
      return Promise.resolve(null)
    }),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
  },
  callanProgress: {
    findUnique: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockImplementation(({ data }) => {
      return Promise.resolve({
        id: 'new-progress-id',
        ...data,
        correctCount: data.isCorrect ? 1 : 0,
        totalCount: 1,
        lastPracticed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }),
    update: vi.fn().mockImplementation(({ data }) => {
      return Promise.resolve({
        ...mockCallanProgress,
        ...data,
        updatedAt: new Date(),
      })
    }),
    upsert: vi.fn().mockImplementation(({ create, update }) => {
      return Promise.resolve({
        id: 'progress-id',
        ...create,
        correctCount: create.isCorrect ? 1 : 0,
        totalCount: 1,
        lastPracticed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }),
  },
  $transaction: vi.fn().mockImplementation(async (arg) => {
    if (Array.isArray(arg)) {
      return Promise.all(arg)
    }
    return arg(createMockPrisma())
  }),
})

describe('Callan Progress API', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    mockPrisma = createMockPrisma()
    app = createApp(mockPrisma)
  })

  describe('POST /api/callan/progress', () => {
    it('records a correct practice result for a new QA item', async () => {
      const progressData = {
        userId: 1,
        qaItemId: 'qa-1',
        mode: 'qa',
        isCorrect: true,
      }

      const response = await request(app)
        .post('/api/callan/progress')
        .send(progressData)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('progress')
      expect(response.body.progress).toHaveProperty('qaItemId', 'qa-1')
      expect(response.body.progress).toHaveProperty('mode', 'qa')
    })

    it('records an incorrect practice result', async () => {
      const progressData = {
        userId: 1,
        qaItemId: 'qa-1',
        mode: 'qa',
        isCorrect: false,
      }

      const response = await request(app)
        .post('/api/callan/progress')
        .send(progressData)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('progress')
    })

    it('updates existing progress when practicing again', async () => {
      mockPrisma.callanProgress.findUnique.mockResolvedValueOnce(mockCallanProgress)

      const progressData = {
        userId: 1,
        qaItemId: 'qa-1',
        mode: 'qa',
        isCorrect: true,
      }

      const response = await request(app)
        .post('/api/callan/progress')
        .send(progressData)

      expect(response.status).toBe(200)
      expect(mockPrisma.callanProgress.update).toHaveBeenCalled()
    })

    it('returns 400 when userId is missing', async () => {
      const response = await request(app)
        .post('/api/callan/progress')
        .send({ qaItemId: 'qa-1', mode: 'qa', isCorrect: true })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('returns 400 when qaItemId is missing', async () => {
      const response = await request(app)
        .post('/api/callan/progress')
        .send({ userId: 1, mode: 'qa', isCorrect: true })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('returns 400 when mode is invalid', async () => {
      const response = await request(app)
        .post('/api/callan/progress')
        .send({ userId: 1, qaItemId: 'qa-1', mode: 'invalid', isCorrect: true })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('returns 400 when isCorrect is not a boolean', async () => {
      const response = await request(app)
        .post('/api/callan/progress')
        .send({ userId: 1, qaItemId: 'qa-1', mode: 'qa', isCorrect: 'yes' })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('returns 404 when qaItem does not exist', async () => {
      mockPrisma.qAItem.findUnique.mockResolvedValueOnce(null)

      const response = await request(app)
        .post('/api/callan/progress')
        .send({ userId: 1, qaItemId: 'non-existent', mode: 'qa', isCorrect: true })

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error', 'QA item not found')
    })

    it('accepts shadowing mode', async () => {
      const progressData = {
        userId: 1,
        qaItemId: 'qa-1',
        mode: 'shadowing',
        isCorrect: true,
      }

      const response = await request(app)
        .post('/api/callan/progress')
        .send(progressData)

      expect(response.status).toBe(200)
      expect(response.body.progress).toHaveProperty('mode', 'shadowing')
    })

    it('accepts dictation mode', async () => {
      const progressData = {
        userId: 1,
        qaItemId: 'qa-1',
        mode: 'dictation',
        isCorrect: true,
      }

      const response = await request(app)
        .post('/api/callan/progress')
        .send(progressData)

      expect(response.status).toBe(200)
      expect(response.body.progress).toHaveProperty('mode', 'dictation')
    })
  })

  describe('GET /api/callan/progress/:lessonId', () => {
    it('returns progress for all QA items in a lesson', async () => {
      const mockProgress = [
        { ...mockCallanProgress, qaItemId: 'qa-1' },
        { ...mockCallanProgress, id: 'progress-2', qaItemId: 'qa-2' },
      ]
      mockPrisma.callanProgress.findMany.mockResolvedValueOnce(mockProgress)

      const response = await request(app)
        .get('/api/callan/progress/lesson-1?userId=1')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('progress')
      expect(Array.isArray(response.body.progress)).toBe(true)
    })

    it('returns 400 when userId is missing', async () => {
      const response = await request(app)
        .get('/api/callan/progress/lesson-1')

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('filters by mode when provided', async () => {
      const response = await request(app)
        .get('/api/callan/progress/lesson-1?userId=1&mode=qa')

      expect(response.status).toBe(200)
      expect(mockPrisma.callanProgress.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            mode: 'qa',
          }),
        })
      )
    })
  })
})
