import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

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
    const { title, description, order, userId } = req.body;

    if (!title || order === undefined || !userId) {
      return res.status(400).json({ error: 'title, order, and userId are required' });
    }

    const prisma = req.app.locals.prisma;
    const lesson = await prisma.lesson.create({
      data: { title, description, order, userId },
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
    const { title, description, order } = req.body;
    const prisma = req.app.locals.prisma;

    const lesson = await prisma.lesson.update({
      where: { id },
      data: { title, description, order },
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
    const { question, answer, order } = req.body;

    if (!question || !answer || order === undefined) {
      return res.status(400).json({ error: 'question, answer, and order are required' });
    }

    const prisma = req.app.locals.prisma;
    const qaItem = await prisma.qAItem.create({
      data: { question, answer, order, lessonId },
    });

    res.status(201).json({ qaItem });
  } catch (error) {
    next(error);
  }
});

// PUT /api/lessons/:lessonId/qa-items/reorder - Reorder QA items
router.put('/:lessonId/qa-items/reorder', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'items array is required' });
    }

    const prisma = req.app.locals.prisma;

    // Use sequential updates instead of transaction array
    for (const item of items) {
      await prisma.qAItem.update({
        where: { id: item.id },
        data: { order: item.order },
      });
    }

    res.json({ message: 'QA items reordered successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
