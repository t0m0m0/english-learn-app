import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

type PrismaLike = Pick<PrismaClient, 'callanProgress' | 'qAItem'>;

const VALID_MODES = ['qa', 'shadowing', 'dictation'] as const;
type Mode = typeof VALID_MODES[number];

// POST /api/callan/progress - Record practice result
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.app.locals.prisma as PrismaLike;
    const { userId, qaItemId, mode, isCorrect } = req.body;

    // Validation
    if (typeof userId !== 'number' || !Number.isInteger(userId)) {
      return res.status(400).json({ error: 'userId must be an integer' });
    }

    if (typeof qaItemId !== 'string' || !qaItemId.trim()) {
      return res.status(400).json({ error: 'qaItemId is required' });
    }

    if (!VALID_MODES.includes(mode)) {
      return res.status(400).json({ error: `mode must be one of: ${VALID_MODES.join(', ')}` });
    }

    if (typeof isCorrect !== 'boolean') {
      return res.status(400).json({ error: 'isCorrect must be a boolean' });
    }

    // Check if QA item exists
    const qaItem = await prisma.qAItem.findUnique({
      where: { id: qaItemId },
    });

    if (!qaItem) {
      return res.status(404).json({ error: 'QA item not found' });
    }

    // Check for existing progress
    const existingProgress = await prisma.callanProgress.findUnique({
      where: {
        userId_qaItemId_mode: {
          userId,
          qaItemId,
          mode,
        },
      },
    });

    let progress;

    if (existingProgress) {
      // Update existing progress
      progress = await prisma.callanProgress.update({
        where: { id: existingProgress.id },
        data: {
          correctCount: existingProgress.correctCount + (isCorrect ? 1 : 0),
          totalCount: existingProgress.totalCount + 1,
          lastPracticed: new Date(),
        },
      });
    } else {
      // Create new progress
      progress = await prisma.callanProgress.create({
        data: {
          userId,
          qaItemId,
          mode,
          correctCount: isCorrect ? 1 : 0,
          totalCount: 1,
          lastPracticed: new Date(),
        },
      });
    }

    res.json({ progress });
  } catch (error) {
    next(error);
  }
});

// GET /api/callan/progress/:lessonId - Get progress for a lesson
router.get('/:lessonId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.app.locals.prisma as PrismaLike;
    const { lessonId } = req.params;
    const userId = parseInt(req.query.userId as string, 10);
    const mode = req.query.mode as Mode | undefined;

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'userId query parameter is required' });
    }

    const whereClause: {
      userId: number;
      qaItem: { lessonId: string };
      mode?: Mode;
    } = {
      userId,
      qaItem: { lessonId },
    };

    if (mode && VALID_MODES.includes(mode)) {
      whereClause.mode = mode;
    }

    const progress = await prisma.callanProgress.findMany({
      where: whereClause,
      include: {
        qaItem: true,
      },
      orderBy: {
        qaItem: { order: 'asc' },
      },
    });

    res.json({ progress });
  } catch (error) {
    next(error);
  }
});

export default router;
