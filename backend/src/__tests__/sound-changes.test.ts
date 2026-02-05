import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'

const mockCategory = {
  id: 'cat-1',
  name: 'Linking',
  nameJa: '連結',
  slug: 'linking',
  description: 'When words connect together smoothly',
  order: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockExercise = {
  id: 'ex-1',
  categoryId: 'cat-1',
  title: 'Basic Linking Practice',
  difficulty: 'beginner',
  order: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockItem = {
  id: 'item-1',
  exerciseId: 'ex-1',
  type: 'fill_blank',
  audioPath: '/audio/sound-changes/linking/01-001.mp3',
  sentence: 'Can I pick it up?',
  blank: 'pick it',
  blankIndex: 2,
  explanation: "'pick it' links as 'pi-kit'",
  order: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockProgress = {
  id: 'progress-1',
  userId: 1,
  itemId: 'item-1',
  accuracy: 100,
  isCorrect: true,
  answeredAt: new Date('2024-01-15'),
}

const createMockPrisma = () => ({
  soundChangeCategory: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
  },
  soundChangeExercise: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
  },
  soundChangeExerciseItem: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
  },
  soundChangeProgress: {
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockImplementation(({ data }) => {
      return Promise.resolve({
        id: 'new-progress-id',
        ...data,
        answeredAt: new Date(),
      })
    }),
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
  listeningPassage: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
  },
  listeningQuestion: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
  },
  listeningProgress: {
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
  },
  $transaction: vi.fn().mockImplementation(async (arg) => {
    if (Array.isArray(arg)) {
      return Promise.all(arg)
    }
    return arg(createMockPrisma())
  }),
})

describe('Sound Changes API', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    mockPrisma = createMockPrisma()
    app = createApp(mockPrisma)
  })

  describe('GET /api/sound-changes/categories', () => {
    it('returns all categories with exercise counts', async () => {
      const categories = [
        { ...mockCategory, exercises: [{ id: 'ex-1' }, { id: 'ex-2' }] },
        { ...mockCategory, id: 'cat-2', name: 'Elision', slug: 'elision', order: 2, exercises: [{ id: 'ex-3' }] },
      ]
      mockPrisma.soundChangeCategory.findMany.mockResolvedValueOnce(categories)

      const response = await request(app).get('/api/sound-changes/categories')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('categories')
      expect(response.body.categories).toHaveLength(2)
    })

    it('returns categories ordered by order field', async () => {
      mockPrisma.soundChangeCategory.findMany.mockResolvedValueOnce([])

      await request(app).get('/api/sound-changes/categories')

      expect(mockPrisma.soundChangeCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { order: 'asc' },
        })
      )
    })
  })

  describe('GET /api/sound-changes/categories/:slug', () => {
    it('returns a category with its exercises', async () => {
      const categoryWithExercises = {
        ...mockCategory,
        exercises: [{ ...mockExercise, items: [{ id: 'item-1' }] }],
      }
      mockPrisma.soundChangeCategory.findFirst.mockResolvedValueOnce(categoryWithExercises)

      const response = await request(app).get('/api/sound-changes/categories/linking')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('category')
      expect(response.body.category).toHaveProperty('name', 'Linking')
      expect(response.body.category.exercises).toHaveLength(1)
    })

    it('returns 404 when category not found', async () => {
      mockPrisma.soundChangeCategory.findFirst.mockResolvedValueOnce(null)

      const response = await request(app).get('/api/sound-changes/categories/non-existent')

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error', 'Category not found')
    })
  })

  describe('GET /api/sound-changes/exercises/:id', () => {
    it('returns an exercise with all items', async () => {
      const exerciseWithItems = {
        ...mockExercise,
        category: { name: 'Linking', nameJa: '連結', slug: 'linking' },
        items: [mockItem],
      }
      mockPrisma.soundChangeExercise.findUnique.mockResolvedValueOnce(exerciseWithItems)

      const response = await request(app).get('/api/sound-changes/exercises/ex-1')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('exercise')
      expect(response.body.exercise).toHaveProperty('title', 'Basic Linking Practice')
      expect(response.body.exercise.items).toHaveLength(1)
      expect(response.body.exercise.category).toHaveProperty('slug', 'linking')
    })

    it('returns 404 when exercise not found', async () => {
      mockPrisma.soundChangeExercise.findUnique.mockResolvedValueOnce(null)

      const response = await request(app).get('/api/sound-changes/exercises/non-existent')

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error', 'Exercise not found')
    })
  })

  describe('POST /api/sound-changes/progress', () => {
    it('records a correct answer', async () => {
      mockPrisma.soundChangeExerciseItem.findUnique.mockResolvedValueOnce(mockItem)

      const response = await request(app)
        .post('/api/sound-changes/progress')
        .send({
          userId: 1,
          itemId: 'item-1',
          accuracy: 100,
          isCorrect: true,
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('progress')
      expect(response.body.progress).toHaveProperty('itemId', 'item-1')
      expect(response.body.progress).toHaveProperty('isCorrect', true)
      expect(response.body.progress).toHaveProperty('accuracy', 100)
    })

    it('returns 400 when userId is missing', async () => {
      const response = await request(app)
        .post('/api/sound-changes/progress')
        .send({ itemId: 'item-1', accuracy: 100, isCorrect: true })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('returns 400 when itemId is missing', async () => {
      const response = await request(app)
        .post('/api/sound-changes/progress')
        .send({ userId: 1, accuracy: 100, isCorrect: true })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('returns 400 when accuracy is not a number', async () => {
      const response = await request(app)
        .post('/api/sound-changes/progress')
        .send({ userId: 1, itemId: 'item-1', accuracy: 'high', isCorrect: true })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('returns 400 when isCorrect is not boolean', async () => {
      const response = await request(app)
        .post('/api/sound-changes/progress')
        .send({ userId: 1, itemId: 'item-1', accuracy: 100, isCorrect: 'yes' })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('returns 404 when item does not exist', async () => {
      mockPrisma.soundChangeExerciseItem.findUnique.mockResolvedValueOnce(null)

      const response = await request(app)
        .post('/api/sound-changes/progress')
        .send({ userId: 1, itemId: 'non-existent', accuracy: 100, isCorrect: true })

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error', 'Exercise item not found')
    })
  })

  describe('GET /api/sound-changes/progress/summary', () => {
    it('returns progress summary for a user', async () => {
      const categories = [
        {
          ...mockCategory,
          exercises: [
            {
              ...mockExercise,
              items: [{ id: 'item-1' }, { id: 'item-2' }],
            },
          ],
        },
      ]
      mockPrisma.soundChangeCategory.findMany.mockResolvedValueOnce(categories)
      mockPrisma.soundChangeProgress.findMany.mockResolvedValueOnce([
        { ...mockProgress, itemId: 'item-1', accuracy: 100, isCorrect: true },
        { ...mockProgress, id: 'p2', itemId: 'item-2', accuracy: 60, isCorrect: false },
      ])

      const response = await request(app)
        .get('/api/sound-changes/progress/summary?userId=1')

      expect(response.status).toBe(200)
      expect(response.body.totalCategories).toBe(1)
      expect(response.body.totalItems).toBe(2)
      expect(response.body.answeredItems).toBe(2)
      expect(response.body.averageAccuracy).toBe(80)
    })

    it('returns 400 when userId is missing', async () => {
      const response = await request(app)
        .get('/api/sound-changes/progress/summary')

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('returns zero values when no progress exists', async () => {
      mockPrisma.soundChangeCategory.findMany.mockResolvedValueOnce([])
      mockPrisma.soundChangeProgress.findMany.mockResolvedValueOnce([])

      const response = await request(app)
        .get('/api/sound-changes/progress/summary?userId=1')

      expect(response.status).toBe(200)
      expect(response.body.totalCategories).toBe(0)
      expect(response.body.totalItems).toBe(0)
      expect(response.body.answeredItems).toBe(0)
      expect(response.body.averageAccuracy).toBe(0)
    })
  })
})
