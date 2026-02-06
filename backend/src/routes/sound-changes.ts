import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

type PrismaLike = Pick<PrismaClient, 'soundChangeCategory' | 'soundChangeExercise' | 'soundChangeExerciseItem' | 'soundChangeProgress'>;

// GET /api/sound-changes/categories - List all categories
router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.app.locals.prisma as PrismaLike;

    const categories = await prisma.soundChangeCategory.findMany({
      orderBy: { order: 'asc' },
      include: {
        exercises: {
          select: { id: true },
        },
      },
    });

    res.json({ categories });
  } catch (error) {
    next(error);
  }
});

// GET /api/sound-changes/categories/:slug - Get category with exercises
router.get('/categories/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.app.locals.prisma as PrismaLike;
    const { slug } = req.params;

    const category = await prisma.soundChangeCategory.findFirst({
      where: { slug },
      include: {
        exercises: {
          orderBy: { order: 'asc' },
          include: {
            items: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category });
  } catch (error) {
    next(error);
  }
});

// GET /api/sound-changes/exercises/:id - Get exercise with items
router.get('/exercises/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.app.locals.prisma as PrismaLike;
    const { id } = req.params;

    const exercise = await prisma.soundChangeExercise.findUnique({
      where: { id },
      include: {
        category: {
          select: { name: true, nameJa: true, slug: true },
        },
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    res.json({ exercise });
  } catch (error) {
    next(error);
  }
});

// POST /api/sound-changes/progress - Record answer result
router.post('/progress', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.app.locals.prisma as PrismaLike;
    const { userId, itemId, accuracy, isCorrect } = req.body;

    if (typeof userId !== 'number' || !Number.isInteger(userId)) {
      return res.status(400).json({ error: 'userId must be an integer' });
    }

    if (typeof itemId !== 'string' || !itemId.trim()) {
      return res.status(400).json({ error: 'itemId is required' });
    }

    if (typeof accuracy !== 'number' || accuracy < 0 || accuracy > 100) {
      return res.status(400).json({ error: 'accuracy must be a number between 0 and 100' });
    }

    if (typeof isCorrect !== 'boolean') {
      return res.status(400).json({ error: 'isCorrect must be a boolean' });
    }

    const item = await prisma.soundChangeExerciseItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return res.status(404).json({ error: 'Exercise item not found' });
    }

    const progress = await prisma.soundChangeProgress.create({
      data: {
        userId,
        itemId,
        accuracy,
        isCorrect,
      },
    });

    res.json({ progress });
  } catch (error) {
    next(error);
  }
});

// GET /api/sound-changes/progress/summary - Get progress summary
router.get('/progress/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.app.locals.prisma as PrismaLike;
    const userId = parseInt(req.query.userId as string, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'userId query parameter is required' });
    }

    const categories = await prisma.soundChangeCategory.findMany({
      include: {
        exercises: {
          include: {
            items: { select: { id: true } },
          },
        },
      },
    });

    const allProgress = await prisma.soundChangeProgress.findMany({
      where: { userId },
    });

    const totalCategories = categories.length;
    const totalItems = categories.reduce(
      (sum, cat) => sum + cat.exercises.reduce(
        (eSum, ex) => eSum + ex.items.length, 0
      ), 0
    );

    const answeredItemIds = new Set(allProgress.map(p => p.itemId));
    const answeredItems = answeredItemIds.size;

    // Calculate average accuracy from the latest attempt per item
    const latestByItem = new Map<string, { accuracy: number; isCorrect: boolean }>();
    for (const p of allProgress) {
      latestByItem.set(p.itemId, { accuracy: p.accuracy, isCorrect: p.isCorrect });
    }
    const accuracyValues = Array.from(latestByItem.values()).map(v => v.accuracy);
    const averageAccuracy = accuracyValues.length > 0
      ? Math.round(accuracyValues.reduce((sum, a) => sum + a, 0) / accuracyValues.length)
      : 0;

    const correctItems = Array.from(latestByItem.values()).filter(v => v.isCorrect).length;

    // Per-category stats
    const byCategory = categories.map(cat => {
      const catItemIds = new Set(
        cat.exercises.flatMap(ex => ex.items.map(item => item.id))
      );
      const catProgress = allProgress.filter(p => catItemIds.has(p.itemId));
      const catAnswered = new Set(catProgress.map(p => p.itemId)).size;
      const catAccuracyValues = catProgress.map(p => p.accuracy);
      const catAvgAccuracy = catAccuracyValues.length > 0
        ? Math.round(catAccuracyValues.reduce((s, a) => s + a, 0) / catAccuracyValues.length)
        : 0;

      return {
        categoryId: cat.id,
        name: cat.name,
        totalExercises: cat.exercises.length,
        totalItems: cat.exercises.reduce((s, ex) => s + ex.items.length, 0),
        answeredItems: catAnswered,
        averageAccuracy: catAvgAccuracy,
      };
    });

    res.json({
      totalCategories,
      totalItems,
      answeredItems,
      correctItems,
      averageAccuracy,
      byCategory,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
