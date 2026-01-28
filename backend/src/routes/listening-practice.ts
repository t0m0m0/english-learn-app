import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

type PrismaLike = Pick<PrismaClient, 'listeningPassage' | 'listeningQuestion' | 'listeningProgress'>;

const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

// GET /api/listening/passages - List all passages
router.get('/passages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.app.locals.prisma as PrismaLike;
    const difficulty = req.query.difficulty as string | undefined;

    const where: { difficulty?: string } = {};
    if (difficulty && VALID_DIFFICULTIES.includes(difficulty as typeof VALID_DIFFICULTIES[number])) {
      where.difficulty = difficulty;
    }

    const passages = await prisma.listeningPassage.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        questions: {
          select: { id: true },
        },
      },
    });

    res.json({ passages });
  } catch (error) {
    next(error);
  }
});

// GET /api/listening/passages/:id - Get passage with questions
router.get('/passages/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.app.locals.prisma as PrismaLike;
    const { id } = req.params;

    const passage = await prisma.listeningPassage.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!passage) {
      return res.status(404).json({ error: 'Passage not found' });
    }

    res.json({ passage });
  } catch (error) {
    next(error);
  }
});

// POST /api/listening/progress - Record answer result
router.post('/progress', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.app.locals.prisma as PrismaLike;
    const { userId, questionId, isCorrect } = req.body;

    // Validation
    if (typeof userId !== 'number' || !Number.isInteger(userId)) {
      return res.status(400).json({ error: 'userId must be an integer' });
    }

    if (typeof questionId !== 'string' || !questionId.trim()) {
      return res.status(400).json({ error: 'questionId is required' });
    }

    if (typeof isCorrect !== 'boolean') {
      return res.status(400).json({ error: 'isCorrect must be a boolean' });
    }

    // Check if question exists
    const question = await prisma.listeningQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const progress = await prisma.listeningProgress.create({
      data: {
        userId,
        questionId,
        isCorrect,
      },
    });

    res.json({ progress });
  } catch (error) {
    next(error);
  }
});

// GET /api/listening/progress/summary - Get progress summary
router.get('/progress/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.app.locals.prisma as PrismaLike;
    const userId = parseInt(req.query.userId as string, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'userId query parameter is required' });
    }

    const passages = await prisma.listeningPassage.findMany({
      include: {
        questions: { select: { id: true } },
      },
    });

    const allProgress = await prisma.listeningProgress.findMany({
      where: { userId },
    });

    const totalPassages = passages.length;
    const totalQuestions = passages.reduce((sum, p) => sum + p.questions.length, 0);
    const answeredQuestionIds = new Set(allProgress.map(p => p.questionId));
    const answeredQuestions = answeredQuestionIds.size;
    const correctAnswers = allProgress.filter(p => p.isCorrect).length;
    const accuracy = allProgress.length > 0
      ? Math.round((correctAnswers / allProgress.length) * 100)
      : 0;

    res.json({
      totalPassages,
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      accuracy,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
