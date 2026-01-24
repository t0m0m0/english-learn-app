import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'

const mockLessons = [
  {
    id: 'lesson-1',
    title: 'Stage 1 - Lesson 1',
    description: 'Introduction to basic phrases',
    order: 1,
    userId: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    qaItems: [],
  },
  {
    id: 'lesson-2',
    title: 'Stage 1 - Lesson 2',
    description: 'Common questions',
    order: 2,
    userId: 1,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    qaItems: [],
  },
]

const mockQAItems = [
  {
    id: 'qa-1',
    question: 'What is this?',
    answer: 'This is a pen.',
    order: 1,
    lessonId: 'lesson-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'qa-2',
    question: 'Is this a book?',
    answer: 'No, this is not a book. This is a pen.',
    order: 2,
    lessonId: 'lesson-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
]

const createMockPrisma = () => ({
  lesson: {
    findMany: vi.fn().mockResolvedValue(mockLessons),
    findUnique: vi.fn().mockImplementation(({ where }) => {
      const found = mockLessons.find(l => l.id === where.id)
      if (found) {
        return Promise.resolve({ ...found, qaItems: mockQAItems.filter(q => q.lessonId === found.id) })
      }
      return Promise.resolve(null)
    }),
    create: vi.fn().mockImplementation(({ data }) => {
      return Promise.resolve({
        id: 'new-lesson-id',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        qaItems: [],
      })
    }),
    update: vi.fn().mockImplementation(({ where, data }) => {
      const found = mockLessons.find(l => l.id === where.id)
      if (!found) {
        const error = new Error('Record not found')
        ;(error as Error & { code?: string }).code = 'P2025'
        return Promise.reject(error)
      }
      return Promise.resolve({ ...found, ...data, updatedAt: new Date() })
    }),
    delete: vi.fn().mockImplementation(({ where }) => {
      const found = mockLessons.find(l => l.id === where.id)
      if (!found) {
        const error = new Error('Record not found')
        ;(error as Error & { code?: string }).code = 'P2025'
        return Promise.reject(error)
      }
      return Promise.resolve(found)
    }),
    count: vi.fn().mockResolvedValue(2),
  },
  qAItem: {
    findMany: vi.fn().mockResolvedValue(mockQAItems),
    findUnique: vi.fn().mockImplementation(({ where }) => {
      const found = mockQAItems.find(q => q.id === where.id)
      return Promise.resolve(found || null)
    }),
    create: vi.fn().mockImplementation(({ data }) => {
      return Promise.resolve({
        id: 'new-qa-id',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }),
    update: vi.fn().mockImplementation(({ where, data }) => {
      const found = mockQAItems.find(q => q.id === where.id)
      if (!found) {
        const error = new Error('Record not found')
        ;(error as Error & { code?: string }).code = 'P2025'
        return Promise.reject(error)
      }
      return Promise.resolve({ ...found, ...data, updatedAt: new Date() })
    }),
    delete: vi.fn().mockImplementation(({ where }) => {
      const found = mockQAItems.find(q => q.id === where.id)
      if (!found) {
        const error = new Error('Record not found')
        ;(error as Error & { code?: string }).code = 'P2025'
        return Promise.reject(error)
      }
      return Promise.resolve(found)
    }),
    updateMany: vi.fn().mockResolvedValue({ count: 2 }),
    count: vi.fn().mockResolvedValue(2),
  },
  $transaction: vi.fn().mockImplementation(async (callback) => {
    return callback(createMockPrisma())
  }),
})

describe('Lessons API', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    mockPrisma = createMockPrisma()
    app = createApp(mockPrisma)
  })

  describe('GET /api/lessons', () => {
    it('returns lessons list for a user', async () => {
      const response = await request(app).get('/api/lessons?userId=1')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('lessons')
      expect(response.body.lessons).toHaveLength(2)
      expect(mockPrisma.lesson.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1 },
          orderBy: { order: 'asc' },
        })
      )
    })

    it('returns 400 when userId is missing', async () => {
      const response = await request(app).get('/api/lessons')

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('GET /api/lessons/:id', () => {
    it('returns a lesson with QA items', async () => {
      const response = await request(app).get('/api/lessons/lesson-1')

      expect(response.status).toBe(200)
      expect(response.body.lesson).toHaveProperty('id', 'lesson-1')
      expect(response.body.lesson).toHaveProperty('qaItems')
      expect(response.body.lesson.qaItems).toHaveLength(2)
    })

    it('returns 404 for non-existent lesson', async () => {
      const response = await request(app).get('/api/lessons/non-existent')

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error', 'Lesson not found')
    })
  })

  describe('POST /api/lessons', () => {
    it('creates a new lesson', async () => {
      const newLesson = {
        title: 'Stage 2 - Lesson 1',
        description: 'Advanced phrases',
        order: 3,
        userId: 1,
      }

      const response = await request(app)
        .post('/api/lessons')
        .send(newLesson)

      expect(response.status).toBe(201)
      expect(response.body.lesson).toHaveProperty('id')
      expect(response.body.lesson).toHaveProperty('title', newLesson.title)
      expect(mockPrisma.lesson.create).toHaveBeenCalledWith({
        data: expect.objectContaining(newLesson),
      })
    })

    it('returns 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/lessons')
        .send({ title: 'Only title' })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('PUT /api/lessons/:id', () => {
    it('updates an existing lesson', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
      }

      const response = await request(app)
        .put('/api/lessons/lesson-1')
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.lesson).toHaveProperty('title', updateData.title)
      expect(mockPrisma.lesson.update).toHaveBeenCalledWith({
        where: { id: 'lesson-1' },
        data: expect.objectContaining(updateData),
      })
    })

    it('returns 404 for non-existent lesson', async () => {
      const response = await request(app)
        .put('/api/lessons/non-existent')
        .send({ title: 'Test' })

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/lessons/:id', () => {
    it('deletes an existing lesson', async () => {
      const response = await request(app).delete('/api/lessons/lesson-1')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message', 'Lesson deleted successfully')
      expect(mockPrisma.lesson.delete).toHaveBeenCalledWith({
        where: { id: 'lesson-1' },
      })
    })

    it('returns 404 for non-existent lesson', async () => {
      const response = await request(app).delete('/api/lessons/non-existent')

      expect(response.status).toBe(404)
    })
  })
})

describe('QA Items API', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    mockPrisma = createMockPrisma()
    app = createApp(mockPrisma)
  })

  describe('POST /api/lessons/:lessonId/qa-items', () => {
    it('creates a new QA item in a lesson', async () => {
      const newQAItem = {
        question: 'What is your name?',
        answer: 'My name is John.',
        order: 3,
      }

      const response = await request(app)
        .post('/api/lessons/lesson-1/qa-items')
        .send(newQAItem)

      expect(response.status).toBe(201)
      expect(response.body.qaItem).toHaveProperty('id')
      expect(response.body.qaItem).toHaveProperty('question', newQAItem.question)
      expect(mockPrisma.qAItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...newQAItem,
          lessonId: 'lesson-1',
        }),
      })
    })

    it('returns 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/lessons/lesson-1/qa-items')
        .send({ question: 'Only question' })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('PUT /api/qa-items/:id', () => {
    it('updates an existing QA item', async () => {
      const updateData = {
        question: 'Updated question?',
        answer: 'Updated answer.',
      }

      const response = await request(app)
        .put('/api/qa-items/qa-1')
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.qaItem).toHaveProperty('question', updateData.question)
      expect(mockPrisma.qAItem.update).toHaveBeenCalledWith({
        where: { id: 'qa-1' },
        data: expect.objectContaining(updateData),
      })
    })

    it('returns 404 for non-existent QA item', async () => {
      const response = await request(app)
        .put('/api/qa-items/non-existent')
        .send({ question: 'Test?' })

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/qa-items/:id', () => {
    it('deletes an existing QA item', async () => {
      const response = await request(app).delete('/api/qa-items/qa-1')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message', 'QA item deleted successfully')
      expect(mockPrisma.qAItem.delete).toHaveBeenCalledWith({
        where: { id: 'qa-1' },
      })
    })

    it('returns 404 for non-existent QA item', async () => {
      const response = await request(app).delete('/api/qa-items/non-existent')

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/lessons/:lessonId/qa-items/reorder', () => {
    it('reorders QA items in a lesson', async () => {
      const reorderData = {
        items: [
          { id: 'qa-2', order: 1 },
          { id: 'qa-1', order: 2 },
        ],
      }

      const response = await request(app)
        .put('/api/lessons/lesson-1/qa-items/reorder')
        .send(reorderData)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message', 'QA items reordered successfully')
    })

    it('returns 400 when items array is missing', async () => {
      const response = await request(app)
        .put('/api/lessons/lesson-1/qa-items/reorder')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })
})
