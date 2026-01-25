import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

// Helper to get userId from request (simplified - in production use auth middleware)
const getUserIdFromRequest = (req: Request): number | null => {
  const userId = req.query.userId || req.body.userId;
  const parsed = parseInt(userId as string);
  return isNaN(parsed) ? null : parsed;
};

// GET /api/lessons - Get all lessons for a user
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.query.userId as string);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'userId is required and must be a number' });
    }

    const prisma = req.app.locals.prisma;
    const lessons = await prisma.lesson.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
      include: { qaItems: { orderBy: { order: 'asc' } } },
    });

    res.json({ lessons });
  } catch (error) {
    next(error);
  }
});

// GET /api/lessons/:id - Get a specific lesson with QA items
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const prisma = req.app.locals.prisma;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: { qaItems: { orderBy: { order: 'asc' } } },
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json({ lesson });
  } catch (error) {
    next(error);
  }
});

// POST /api/lessons - Create a new lesson
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { description, order, userId } = req.body;
    const title = req.body.title?.trim();

    if (!title || order === undefined || !userId) {
      return res.status(400).json({ error: 'title, order, and userId are required' });
    }

    const prisma = req.app.locals.prisma;
    const lesson = await prisma.lesson.create({
      data: { title, description: description?.trim() || null, order, userId },
    });

    res.status(201).json({ lesson });
  } catch (error) {
    next(error);
  }
});

// PUT /api/lessons/:id - Update a lesson
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { description, order } = req.body;
    const title = req.body.title?.trim();
    const prisma = req.app.locals.prisma;

    // Authorization check: verify user owns this lesson
    const requestingUserId = getUserIdFromRequest(req);
    if (requestingUserId) {
      const existing = await prisma.lesson.findUnique({ where: { id } });
      if (existing && existing.userId !== requestingUserId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const lesson = await prisma.lesson.update({
      where: { id },
      data: {
        title,
        description: description?.trim() || null,
        order
      },
    });

    res.json({ lesson });
  } catch (error) {
    if ((error as Error & { code?: string }).code === 'P2025') {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    next(error);
  }
});

// DELETE /api/lessons/:id - Delete a lesson
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const prisma = req.app.locals.prisma;

    // Authorization check: verify user owns this lesson
    const requestingUserId = getUserIdFromRequest(req);
    if (requestingUserId) {
      const existing = await prisma.lesson.findUnique({ where: { id } });
      if (existing && existing.userId !== requestingUserId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    await prisma.lesson.delete({
      where: { id },
    });

    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    if ((error as Error & { code?: string }).code === 'P2025') {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    next(error);
  }
});

// POST /api/lessons/:lessonId/qa-items - Create a new QA item
router.post('/:lessonId/qa-items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lessonId } = req.params;
    const { order } = req.body;
    const question = req.body.question?.trim();
    const answer = req.body.answer?.trim();

    if (!question || !answer || order === undefined) {
      return res.status(400).json({ error: 'question, answer, and order are required' });
    }

    const prisma = req.app.locals.prisma;

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const qaItem = await prisma.qAItem.create({
      data: { question, answer, order, lessonId },
    });

    res.status(201).json({ qaItem });
  } catch (error) {
    if ((error as Error & { code?: string }).code === 'P2003') {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    next(error);
  }
});

// PUT /api/lessons/:lessonId/qa-items/reorder - Reorder QA items
router.put('/:lessonId/qa-items/reorder', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lessonId } = req.params;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required and must not be empty' });
    }

    // Validate item structure
    for (const item of items) {
      if (!item.id || typeof item.id !== 'string' || typeof item.order !== 'number') {
        return res.status(400).json({ error: 'Each item must have a valid id (string) and order (number)' });
      }
    }

    const prisma = req.app.locals.prisma;

    // Verify all items belong to this lesson
    const qaItems = await prisma.qAItem.findMany({
      where: { id: { in: items.map((i: { id: string }) => i.id) } },
      select: { id: true, lessonId: true },
    });

    if (qaItems.length !== items.length) {
      return res.status(404).json({ error: 'One or more QA items not found' });
    }

    if (qaItems.some((qa: { lessonId: string }) => qa.lessonId !== lessonId)) {
      return res.status(400).json({ error: 'All items must belong to the specified lesson' });
    }

    // Use transaction for atomic updates
    await prisma.$transaction(
      items.map((item: { id: string; order: number }) =>
        prisma.qAItem.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    res.json({ message: 'QA items reordered successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
